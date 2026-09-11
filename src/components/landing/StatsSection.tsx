import { useEffect, useRef, useState } from "react";

const counters = [
  { target: 5, suffix: " min", label: "To build a pre-lecture activity" },
  { target: 8, suffix: "+", label: "Question types available" },
  { target: 0, suffix: "", label: "Student logins required" },
];

const useCountUp = (target: number, run: boolean) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!run || target === 0) return;
    let frame = 0;
    const total = 40;
    const id = setInterval(() => {
      frame += 1;
      setValue(Math.round((target * frame) / total));
      if (frame >= total) clearInterval(id);
    }, 25);
    return () => clearInterval(id);
  }, [run, target]);
  return value;
};

const Counter = ({
  target,
  suffix,
  label,
  run,
  onBand,
}: {
  target: number;
  suffix: string;
  label: string;
  run: boolean;
  onBand: boolean;
}) => {
  const value = useCountUp(target, run);
  return (
    <div className="text-center">
      <div
        className="text-4xl md:text-5xl font-display"
        style={{ color: onBand ? "hsl(var(--hero-band-foreground))" : "hsl(var(--foreground))" }}
      >
        {value}
        {suffix}
      </div>
      <div
        className="text-xs uppercase tracking-[0.14em] mt-3"
        style={{ color: onBand ? "hsl(var(--hero-band-muted))" : "hsl(var(--muted-foreground))" }}
      >
        {label}
      </div>
    </div>
  );
};

export const StatsSection = ({ tone = "light" }: { tone?: "light" | "band" }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const onBand = tone === "band";

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="grid grid-cols-1 sm:grid-cols-3 gap-10 pt-12 border-t"
      style={{ borderColor: onBand ? "hsl(var(--hero-band-muted) / 0.25)" : "hsl(var(--border))" }}
    >
      {counters.map((c) => (
        <Counter key={c.label} target={c.target} suffix={c.suffix} label={c.label} run={visible} onBand={onBand} />
      ))}
    </div>
  );
};
