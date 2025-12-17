import type { Route } from "./+types/about";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "About Me" },
    { name: "description", content: "Learn more about me." },
  ];
}

export default function About() {
  return (
    <div className="container mx-auto px-4 py-30">
      <section>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
          About Me
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          I’m a tech nerd at heart who just likes building things.
        </p>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          For a long time, I was happy enough to show up, do my job, and go
          home. Lately, that doesn’t feel like enough. The world’s changing too
          fast to just sit in the passenger seat, so this is me trying to get
          back behind the wheel.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-4">
          Professional History
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          I went to school for software development, fully expecting to write
          code for a living. Like most plans, that didn’t quite survive contact
          with reality.
        </p>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Instead, I ended up in IT, managing systems, building networks, and
          keeping other people’s stuff running. It wasn’t what I pictured, but
          it taught me a lot about how things actually work in the real world
          and how they break.
        </p>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          A couple of years ago, I finally made the jump back to what I really
          wanted to do: building software. That’s what led to this site. This is
          where I’m going to put the things I’m working on and think out loud
          about the stuff that interests me.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-4">
          What I’m Building Now
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Right now, the main project is this website.
        </p>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          I want this to be a place where I can dump research, ideas,
          experiments, and whatever else I’m into at the moment, without it
          turning into a complete mess. That means I’m not just writing; I’m
          also figuring out how to structure everything so it stays usable as it
          grows.
        </p>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          I’m especially interested in AI at the moment, how it can actually be
          useful, where it goes off the rails, and what it means for the way we
          work and live. I’ll be sharing my own experiments and thoughts as I
          go, the good and the bad.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-4">
          Other Things That Interest Me
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          I’m not just staring at code and AI all day.
        </p>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          I care a lot about how we live inside all this technology, how we
          treat our bodies and our brains, how we stay sane, and how we spend
          our time. You’ll probably see me writing about health and wellness,
          fitness, video games, meditation, and psychology. Sometimes it’ll just
          be me exploring something new. Other times I’ll be trying to nudge
          people, including myself, to take certain things a bit more seriously.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-4">
          If You Made It This Far
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          If any of this sounds interesting, stick around. I’ll keep building,
          breaking things, and writing about what I learn here.
        </p>
      </section>
    </div>
  );
}
