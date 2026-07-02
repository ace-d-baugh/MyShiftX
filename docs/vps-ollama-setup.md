# VPS Ollama Setup — Photo Schedule Import (Task 15)

Target machine: RackNerd VPS · AlmaLinux 8 · **4.5 GB RAM · 3 CPU cores · no GPU** · New York.

The app side is already built: `/api/schedule-import` sends the photo to
`$VPS_OLLAMA_URL/api/chat` with an `Authorization: Bearer $VPS_OLLAMA_SECRET`
header. This guide gets the VPS answering that call.

---

## 0. Reality check for this hardware

- **`llama3.2-vision` will NOT fit** — it needs ~8 GB. Don't pull it.
- **`llava:7b` is too tight** — ~4.7 GB for the model alone; the OS + nginx need room too.
- **Recommended: `qwen2.5vl:3b`** (~3.2 GB) — Qwen2.5-VL is unusually good at
  document/table OCR for its size, which is exactly what schedule photos are.
- **Fallback if RAM is a problem: `moondream`** (~1.7 GB) — noticeably less accurate.
- CPU-only on 3 cores: expect **30–90 seconds per photo**, plus a one-time
  model load (~1–2 min) after idle/restart. The app's `keep_alive: 60m` keeps
  the model resident between imports.

## 1. Add swap (safety net against OOM)

4.5 GB is workable but has no headroom. 4 GB of swap prevents the kernel from
killing Ollama mid-inference:

```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h   # verify: Swap: 4.0Gi
```

## 2. Install Ollama

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

The installer creates an `ollama` systemd service. Verify:

```bash
systemctl status ollama
ollama --version   # needs >= 0.7 for qwen2.5vl; the script installs latest
```

Keep Ollama bound to localhost (the default `127.0.0.1:11434`) — nginx will be
the only public door. Two settings worth pinning:

```bash
sudo systemctl edit ollama
```

Paste into the editor:

```ini
[Service]
Environment="OLLAMA_NUM_PARALLEL=1"
Environment="OLLAMA_MAX_LOADED_MODELS=1"
```

(One request at a time — parallel inference on 3 cores just makes both slower
and doubles RAM.) Then:

```bash
sudo systemctl daemon-reload && sudo systemctl restart ollama
```

## 3. Pull the model and smoke-test locally

```bash
ollama pull qwen2.5vl:3b
```

Test with any image on the box (or `scp` a schedule photo up):

```bash
curl http://127.0.0.1:11434/api/chat -d '{
  "model": "qwen2.5vl:3b",
  "stream": false,
  "messages": [{
    "role": "user",
    "content": "Describe this image in one sentence.",
    "images": ["'"$(base64 -w0 /path/to/test.jpg)"'"]
  }]
}'
```

First call is slow (model load). Watch memory during it: `watch -n2 free -h`.
If it swaps heavily or gets OOM-killed, switch to `ollama pull moondream` and
set `OLLAMA_VISION_MODEL=moondream` in Vercel later.

## 4. nginx reverse proxy with a secret header

Generate the shared secret first (save it — it becomes `VPS_OLLAMA_SECRET`):

```bash
openssl rand -hex 32
```

Install nginx if it isn't already serving digitalelegance.com:

```bash
sudo dnf install -y nginx
sudo systemctl enable --now nginx
```

Create `/etc/nginx/conf.d/ollama.conf` (replace `YOUR_SECRET_HERE` and the
server_name with the hostname you'll use, e.g. `vps.digitalelegance.com`):

```nginx
server {
    listen 443 ssl;
    server_name vps.digitalelegance.com;

    # Managed by certbot (step 6) — or reuse your existing cert paths:
    ssl_certificate     /etc/letsencrypt/live/vps.digitalelegance.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vps.digitalelegance.com/privkey.pem;

    location /ollama/ {
        # Reject anything without the shared secret
        if ($http_authorization != "Bearer YOUR_SECRET_HERE") {
            return 401;
        }

        proxy_pass http://127.0.0.1:11434/;
        proxy_http_version 1.1;

        # CPU inference is slow — don't let nginx cut the request off
        proxy_read_timeout 180s;
        proxy_send_timeout 180s;

        # Base64 images are large
        client_max_body_size 20m;

        proxy_set_header Host $host;
    }

    # Everything else on this vhost: nothing to see
    location / { return 404; }
}
```

Note the trailing slash on `proxy_pass http://127.0.0.1:11434/;` — it strips
the `/ollama/` prefix, so `https://…/ollama/api/chat` → `localhost:11434/api/chat`.

## 5. AlmaLinux specifics: firewalld + SELinux

Both will silently break this if skipped:

```bash
# Open HTTPS (and HTTP for the certbot challenge)
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --reload

# SELinux blocks nginx from proxying to localhost:11434 by default.
# Without this you'll get 502s with "Permission denied" in the nginx error log.
sudo setsebool -P httpd_can_network_connect 1
```

Do **not** open port 11434 in firewalld — Ollama stays localhost-only.

## 6. TLS certificate (skip if the hostname already has one)

```bash
sudo dnf install -y certbot python3-certbot-nginx
sudo certbot --nginx -d vps.digitalelegance.com
```

First add a DNS A record: `vps.digitalelegance.com → 192.3.81.8` (or whatever
hostname you choose). Certbot auto-renews via its systemd timer.

Then validate and reload nginx:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

## 7. End-to-end test from your own machine

```bash
# Wrong secret → 401 (proves the gate works)
curl -i https://vps.digitalelegance.com/ollama/api/tags -H "Authorization: Bearer wrong"

# Right secret → JSON listing qwen2.5vl:3b
curl https://vps.digitalelegance.com/ollama/api/tags -H "Authorization: Bearer YOUR_SECRET_HERE"
```

## 8. Wire up Vercel

Add to Vercel → Project → Settings → Environment Variables (and `.env.local`
for local dev):

| Variable | Value |
|---|---|
| `VPS_OLLAMA_URL` | `https://vps.digitalelegance.com/ollama` (no trailing slash) |
| `VPS_OLLAMA_SECRET` | the `openssl rand -hex 32` value |
| `OLLAMA_VISION_MODEL` | *(optional)* defaults to `qwen2.5vl:3b`; set `moondream` if you downgraded |

Redeploy, then: **My Calendar → Import Schedule → photo of a schedule** →
review table → Add to Calendar.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| 502 from nginx, "Permission denied (13)" in `/var/log/nginx/error.log` | SELinux — rerun `setsebool -P httpd_can_network_connect 1` |
| 401 from the app | Secret mismatch between nginx config and `VPS_OLLAMA_SECRET` |
| "Reading the schedule took too long" | Model was cold-loading, or photo too large — retry once; keep photos under ~2 MP |
| Ollama killed mid-request (`dmesg | grep -i oom`) | RAM — confirm swap is on; switch to `moondream` |
| Works via curl, fails from Vercel | DNS record missing, or firewalld blocking 443 |

## Cost of doing nothing else

The route returns **503 "Schedule import is not configured yet"** until the
two env vars exist in Vercel — the feature is invisible-safe to deploy before
the VPS is ready.
