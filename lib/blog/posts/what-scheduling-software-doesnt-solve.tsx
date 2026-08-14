export default function Body() {
  return (
    <>
      <p>
        Modern scheduling software is good at building schedules, enforcing rules, and giving
        managers a dashboard. It is usually less good at the peer-to-peer problem: one worker
        needs a shift covered, another is willing and qualified, and both need a clean way to find
        each other and record the agreement.
      </p>

      <h2>What the software typically handles well</h2>
      <p>
        Publishing the schedule, tracking hours, managing leave requests, and applying overtime
        rules. These are centralized problems and software is good at centralized problems.
      </p>

      <h2>What it typically leaves to chat</h2>
      <p>
        The actual matching of cover. Most systems still push workers into group chats, email
        threads, or informal conversations to find someone to take a shift. Those channels are
        streams ordered by time. They bury posts, mix them with unrelated talk, and provide no
        reliable record of who agreed to what.
      </p>

      <h2>The gap a board fills</h2>
      <p>
        A dedicated shift board is a set of records ordered by relevance. Posts expire. Roles and
        locations can be filtered. Agreements can be confirmed. The audience is limited to
        verified coworkers. None of that replaces the official scheduling system. It sits beside
        it and handles the part the scheduling system was never designed for.
      </p>
      <p>
        Workers who only have a group chat will keep using the group chat. Workers who have a
        board that is actually maintained will use the board. The software stack is incomplete
        until both halves exist.
      </p>
    </>
  )
}
