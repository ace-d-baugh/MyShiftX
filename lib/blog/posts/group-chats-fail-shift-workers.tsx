export default function Body() {
  return (
    <>
      <p>
        Almost every workplace that runs on shifts has, at some point, solved its scheduling
        problem with a group chat. Somebody starts a WhatsApp group or a Facebook group, adds
        forty coworkers, and for about three weeks it works beautifully. Then it stops working,
        and nobody can quite say when.
      </p>
      <p>
        It is worth being precise about why, because &ldquo;group chats are chaotic&rdquo; is a
        complaint, not a diagnosis. The failure is structural. A chat is a stream of messages
        ordered by time, and a shift board is a set of records ordered by relevance. Those are
        different data structures, and no amount of discipline makes one behave like the other.
      </p>

      <h2>The post has a lifespan of about eleven minutes</h2>
      <p>
        You post your Thursday evening shift at 9am. By 9:15 someone has asked what everyone is
        doing this weekend, someone else has posted a photo of a sign the company put up in the
        break room, and there are twenty messages between your offer and the bottom of the
        thread. By lunchtime your shift is four screens up.
      </p>
      <p>
        The people most likely to take that shift — the ones who want extra hours — are the ones
        least likely to see it, because they are at work. They check their phone on a fifteen
        minute break, see 63 unread messages, and scroll to the bottom. The bottom is where the
        newest chatter is, not where your offer is.
      </p>
      <p>
        So you bump it. Everyone bumps. Bumping is a workaround for the absence of sorting, and it
        makes the underlying problem worse: more messages, faster scroll, shorter lifespan for the
        next post.
      </p>

      <h2>Nothing ever expires</h2>
      <p>
        This is the one that costs people real money. A group chat has no concept of a shift that
        has already happened. Your Thursday evening post is still sitting there on Saturday, and on
        Sunday, and next month. It looks exactly like a live offer, because in a chat there is no
        difference between a live offer and a dead one.
      </p>
      <p>
        The practical consequence is that anyone scrolling back — which is what you do when you
        need hours — is reading a mixture of live and expired posts with no way to tell them apart
        except by checking every date against a calendar. Most people do that once, get it wrong,
        message somebody about a shift from three weeks ago, feel stupid, and stop scrolling back
        at all. The archive becomes noise.
      </p>
      <p>
        A shift board fixes this by making expiry a property of the post rather than something a
        human has to remember. On MyShiftX a shift comes down thirty minutes before it starts and a
        coverage request comes down at the end of the day it is for. Nobody has to tidy up. The
        board only ever shows things that can still happen.
      </p>

      <h2>Everyone gets every notification, so everyone mutes it</h2>
      <p>
        A group of forty people generates a lot of noise. If you are certified on one position at
        one location, the overwhelming majority of posts are irrelevant to you — a shift you cannot
        cover, at a site you do not work, in a role you are not trained on.
      </p>
      <p>
        Chat apps offer exactly two settings: notified for everything, or notified for nothing.
        Faced with that choice, people mute. And a muted group chat is worse than no group chat,
        because everyone still believes the shift board exists and is being read. Offers go out into
        a room where the lights are on and nobody is home.
      </p>
      <p>
        The fix requires the system to know something about you: your roles, your locations, your
        availability. A stream of text messages cannot know any of that. It has no fields.
      </p>

      <h2>The membership list is wrong, and it is wrong in a way that matters</h2>
      <p>
        Group chats accumulate. People leave the company and stay in the chat. Someone&apos;s partner
        gets added. A former manager is still in there from two restructures ago. Nobody wants to
        remove anyone because removing somebody from a group chat is socially awkward in a way that
        revoking an account is not.
      </p>
      <p>
        Most of the time this is merely untidy. Occasionally it is a genuine problem: schedules
        reveal when a building is short-staffed, when a specific person is alone on site, and where
        somebody will be at 11pm on a Tuesday. That is not information you want in a group whose
        membership nobody has audited since 2023.
      </p>
      <p>
        Facebook groups are worse on this axis, not better. Search a few workplace names and you
        will find open groups where anybody can read the posts, and &ldquo;private&rdquo; groups
        with two thousand members and three admins who no longer work there. You are also posting
        your real name, your face, and your work location to a platform whose business model is
        building a profile of you.
      </p>

      <h2>There is no record of what was agreed</h2>
      <p>
        Two people sort out a trade in a chat. One says &ldquo;yeah I can take Thursday&rdquo;. The
        other says &ldquo;legend, thanks&rdquo;. Neither tells the scheduler, because both assume
        the other did. On Thursday nobody turns up.
      </p>
      <p>
        The chat contains the evidence, technically. It is somewhere in a thread with four hundred
        messages, and searching for &ldquo;Thursday&rdquo; returns every use of the word Thursday
        since March. What is missing is not the information but the structure: a record attached to
        a specific shift, showing who offered it, who took it, and when.
      </p>

      <h2>What actually solves it</h2>
      <p>
        None of the above is an argument that shift workers should be more organized. People are
        already organized; they are working two jobs and coordinating childcare. The tool is what is
        failing, and it is failing because it was built for group conversation and pressed into
        service as scheduling infrastructure.
      </p>
      <p>
        The properties you want are unglamorous. Posts that sort by when the shift is, not when it
        was typed. Automatic expiry. Filters that know your role and your location. A private
        membership list tied to an actual workplace. Direct messages attached to the shift they are
        about. A visible record of who agreed to what.
      </p>
      <p>
        That is what MyShiftX is: a board that does those six things and stays out of the way
        otherwise. It is not trying to be a social network for your workplace. Your workplace
        already has too many of those. It is trying to make sure that when somebody needs a Thursday
        covered, the person who wants a Thursday finds out.
      </p>
      <p>
        You can look around{' '}
        <a href="/wall">the Wall</a> to see how posts are laid out, or read{' '}
        <a href="/blog/shift-trading-etiquette">the etiquette guide</a> for the human half of the
        problem, which no software fixes.
      </p>
    </>
  )
}
