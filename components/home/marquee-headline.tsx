const ROW_ONE = ["NEXUS", "UTILITY", "SYSTEM", "FW—26"];
const ROW_TWO = ["ENGINEERED", "FOR", "THE", "EVERYDAY"];

export function MarqueeHeadline() {
  const one = [...ROW_ONE, ...ROW_ONE, ...ROW_ONE];
  const two = [...ROW_TWO, ...ROW_TWO, ...ROW_TWO];

  return (
    <section
      aria-hidden
      className="overflow-hidden border-y border-border bg-background py-8 md:py-12"
    >
      <div className="animate-marquee-slow flex w-max whitespace-nowrap">
        {one.map((word, index) => (
          <span
            key={`one-${index}`}
            className="font-hand mx-6 text-6xl font-bold uppercase leading-none tracking-tight text-foreground md:mx-10 md:text-[9rem]"
          >
            {word}
            <span className="text-outline ml-6 md:ml-10">/</span>
          </span>
        ))}
      </div>
      <div className="animate-marquee-reverse mt-2 flex w-max whitespace-nowrap md:mt-4">
        {two.map((word, index) => (
          <span
            key={`two-${index}`}
            className="text-outline font-hand mx-6 text-6xl font-bold uppercase leading-none tracking-tight md:mx-10 md:text-[9rem]"
          >
            {word}
            <span className="ml-6 text-foreground md:ml-10">•</span>
          </span>
        ))}
      </div>
    </section>
  );
}
