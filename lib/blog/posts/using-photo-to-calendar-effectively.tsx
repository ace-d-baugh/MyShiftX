export default function Body() {
  return (
    <>
      <p>
        Re-typing a week of shifts from a paper schedule or a screenshot is slow and easy to get
        wrong. Photographing the schedule and letting the system pull the times into your calendar
        is faster &mdash; provided you treat the result as a draft, not as gospel.
      </p>

      <h2>What the feature is for</h2>
      <p>
        It exists to remove the boring transcription step. You take a photo of the posted schedule
        (or upload a screenshot from the scheduling app), the system finds your row, and the
        shifts land on your calendar for review. You confirm them. They become part of your record
        and, where relevant, visible on the board.
      </p>

      <h2>What to check every time</h2>
      <p>Before you hit confirm:</p>
      <ul>
        <li>Is this actually your row? On a full-team schedule the system can mis-identify lines that look similar.</li>
        <li>Are the dates correct? A shifted week or a misread day number is the most common error.</li>
        <li>Are the start and end times right? Handwritten schedules and low-contrast screenshots produce the most mistakes here.</li>
        <li>Do any of the imported shifts overlap with something already on your calendar? The system should flag this; still look.</li>
        <li>Is the role or station correct if it appears? A wrong role can cause problems later if the shift is offered or swapped.</li>
      </ul>
      <p>Two minutes of checking prevents hours of confusion later.</p>

      <h2>When the photo is hard to read</h2>
      <p>
        Bad lighting, crumpled paper, or a screenshot with low resolution will produce more
        errors. If the extract looks messy, fix the source rather than correcting every field by
        hand: take the photo again square-on, in better light, or crop more tightly to your
        section of the schedule.
      </p>

      <h2>Keep one calendar that wins</h2>
      <p>
        The point of importing is to have a single place that reflects what you are actually
        working. If you also keep shifts in a phone calendar, a paper diary, and a group chat, the
        import just adds a fourth source of truth. Decide which calendar is authoritative and put
        everything there. When something changes, update that one first. This is most of why
        MyShiftX has <a href="/calendar">a calendar view</a> at all.
      </p>

      <h2>After a schedule change</h2>
      <p>
        Published schedules get amended. When your workplace issues a revision, re-import or
        manually update the affected days rather than assuming the old extract is still current. A
        calendar that is three days out of date is more dangerous than no calendar at all, because
        you will trust it.
      </p>
      <p>
        Used carefully, photo import removes the most tedious part of living on a rotating
        schedule. Used carelessly, it creates a confident wrong record. The review step is the
        whole difference.
      </p>
    </>
  )
}
