export default function Body() {
  return (
    <>
      <p>
        Modern scheduling software is good at building rotas, enforcing rules, and giving managers a dashboard. It is usually less good at the peer-to-peer problem: one worker needs a shift covered, another is willing and qualified, and both need a clean way to find each other and record the agreement.
      </p>

      <p>
        I’ve used (and watched teams use) most of the major systems. They do a solid job on the manager side. On the worker side the cover conversation still often ends up in a group chat or a string of private messages. That is the gap.
      </p>

      <h2>What the Software Typically Handles Well</h2>

      <p>
        Publishing the schedule, tracking hours, managing leave requests, and applying overtime rules. These are centralised problems and software is good at centralised problems.
      </p>

      <p>
        The best systems also handle qualifications, location rules, and basic availability windows. Managers get visibility. Payroll gets cleaner data. Compliance is easier to demonstrate. Those are real gains and they matter.
      </p>

      <p>
        None of that, however, solves the everyday problem of “I need this Saturday covered and I need to find someone qualified who actually wants the hours.”
      </p>

      <h2>What It Typically Leaves to Chat</h2>

      <p>
        The actual matching of cover. Most systems still push workers into group chats, email threads, or informal conversations to find someone to take a shift. Those channels are streams ordered by time. They bury posts, mix them with unrelated talk, and provide no reliable record of who agreed to what.
      </p>

      <p>
        I’ve seen the same pattern in restaurants, hospitals, warehouses, and retail. The official system publishes the rota. The real cover work happens somewhere else — usually a group chat that is also used for memes, shift gossip, and last-minute “who’s on tonight?” questions. Important posts disappear. Soft yeses go unconfirmed. The official system never sees the agreement until someone remembers to file the paperwork.
      </p>

      <p>
        That is not a failure of the people. It is a design gap.
      </p>

      <h2>The Gap a Board Fills</h2>

      <p>
        A dedicated shift board is a set of records ordered by relevance. Posts expire. Roles and locations can be filtered. Agreements can be confirmed. The audience is limited to verified coworkers. None of that replaces the official scheduling system. It sits beside it and handles the part the scheduling system was never designed for.
      </p>

      <p>
        The useful board does a few specific things well:
      </p>

      <ul>
        <li>Makes the type of deal (giveaway, swap, coverage request) visible at a glance.</li>
        <li>Lets people filter by role, location, and date so they only see relevant posts.</li>
        <li>Requires a clear claim and a confirmation step.</li>
        <li>Leaves a record that both people and the scheduler can see.</li>
        <li>Reduces the noise that makes group chats hard to use for actual cover.</li>
      </ul>

      <p>
        Workers who only have a group chat will keep using the group chat. Workers who have a board that is actually maintained will use the board. The software stack is incomplete until both halves exist.
      </p>

      <h2>Why “Just Use the Official System” Is Not Enough</h2>

      <p>
        Some managers reasonably ask why people cannot simply request leave or offer availability inside the official tool. The answer is practical. Official systems are built for top-down publishing and approval. They are rarely built for fast, peer-level matching with the level of detail workers need (tips potential, real workload, recovery impact, exact station, etc.).
      </p>

      <p>
        A leave request is not the same as “I’m giving away this specific shift and here is what the day is actually like.” A availability flag is not the same as “I can take a midweek daytime in return for this Saturday.” The peer conversation still has to happen. The question is whether it happens in a structured place or in a noisy stream.
      </p>

      <h2>What Good Looks Like in Practice</h2>

      <p>
        The workplaces that handle this best usually have three layers:
      </p>

      <ol>
        <li>The official scheduling system for the published rota, hours tracking, and final approval.</li>
        <li>A dedicated board (or equivalent structured tool) for offering, requesting, and confirming cover.</li>
        <li>Clear rules about when a trade is considered locked and who files the paperwork.</li>
      </ol>

      <p>
        When those three pieces are present, the chaos drops. When any one of them is missing, the remaining pieces get overloaded and people fall back to the least structured channel available.
      </p>

      <h2>Industry Patterns</h2>

      <ul>
        <li><strong>Restaurants &amp; bars</strong> — group chats dominate because the official tools rarely capture tip potential or real walk-out times. A board that lets people note those details gets used.</li>
        <li><strong>Healthcare</strong> — qualifications and float rules make unstructured chat especially risky. Structured claiming reduces the chance of someone taking a shift they are not cleared for.</li>
        <li><strong>Warehouse / manufacturing</strong> — overtime thresholds and mandatory versus optional shifts are easier to handle when the board surfaces that information early.</li>
        <li><strong>Retail</strong> — multi-location teams benefit from location filters so people are not scrolling past posts for sites they cannot work.</li>
      </ul>

      <h2>The Missing Half of the Stack</h2>

      <p>
        Most organizations invest heavily in the official scheduling and payroll side. The peer-matching side is left to improvisation. That imbalance is why group chats remain the default even in workplaces that already pay for sophisticated scheduling software. Closing the gap does not require replacing the official system. It requires adding the structured worker-to-worker layer that the official system was never designed to provide.
      </p>

      <h2>Bottom Line</h2>

      <p>
        Good scheduling software solves the manager and payroll problems. It does not automatically solve the peer matching problem. Workers still need a structured way to offer, request, discuss, and confirm cover with each other.
      </p>

      <p>
        That is exactly the gap MyShiftX is built to fill. The Wall sits beside your official scheduling system: people post giveaways, swaps, and coverage requests with the required details, claim with a clear confirmation step, and message inside the same board. The official system still owns approval and payroll. The board handles the messy peer-to-peer matching that group chats handle poorly.
      </p>

      <p>
        The practical test is simple: when someone needs a shift covered, do they open the official tool or do they open a chat? If the answer is still the chat, the software stack is not finished yet. Closing that gap is what turns a published rota into a system people can actually use to keep the floor staffed without constant last-minute stress.
      </p>
    </>
  )
}
