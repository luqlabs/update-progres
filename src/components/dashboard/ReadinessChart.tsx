import { cn } from "@/lib/utils";

export type ScoreBand = "struggling" | "developing" | "secure";

interface ReadinessChartProps {
  bands: { struggling: number; developing: number; secure: number };
  medianScore: number | null;
  completionRate: number | null;
  responseCount: number;
  activeBand: ScoreBand | null;
  onBandClick: (band: ScoreBand) => void;
  termLabel: string;
}

const BANDS: { key: ScoreBand; label: string; range: string }[] = [
  { key: "struggling", label: "Struggling", range: "below 50%" },
  { key: "developing", label: "Developing", range: "50–74%" },
  { key: "secure", label: "Secure", range: "75% and above" },
];

const pct = (value: number | null) =>
  value === null ? "—" : `${Math.round(value * 100)}%`;

export const ReadinessChart = ({
  bands,
  medianScore,
  completionRate,
  responseCount,
  activeBand,
  onBandClick,
  termLabel,
}: ReadinessChartProps) => {
  const total = bands.struggling + bands.developing + bands.secure;

  return (
    <section className="border border-primary/15 bg-card/60">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 px-4 sm:px-6 md:px-10 pt-6 md:pt-8 pb-5">
        <div>
          <div className="text-[10px] font-bold tracking-[0.25em] uppercase text-accent mb-2">
            Cohort readiness
          </div>
          <h2 className="font-display italic text-2xl md:text-3xl leading-tight text-foreground">
            Where your students stand
          </h2>
        </div>
        <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-primary/50">
          {termLabel} · {total} graded {total === 1 ? "response" : "responses"}
        </p>
      </div>

      <div className="border-t border-primary/15" />

      <div className="px-4 sm:px-6 md:px-10 py-6 md:py-8">
        {total === 0 ? (
          <p className="text-sm text-primary/60 leading-relaxed max-w-md">
            No graded responses yet this term. Share an activity link and this
            breakdown fills in as students finish.
          </p>
        ) : (
          <div className="space-y-4">
            {BANDS.map(band => {
              const count = bands[band.key];
              const share = total > 0 ? count / total : 0;
              const isActive = activeBand === band.key;
              return (
                <button
                  key={band.key}
                  type="button"
                  onClick={() => onBandClick(band.key)}
                  className="w-full text-left group"
                  title={`${count} responses ${band.range}`}
                >
                  <div className="flex items-baseline justify-between gap-4 mb-1.5">
                    <span
                      className={cn(
                        "text-[11px] font-semibold tracking-[0.18em] uppercase transition-colors",
                        isActive ? "text-foreground" : "text-primary/60 group-hover:text-foreground"
                      )}
                    >
                      {band.label}
                      <span className="ml-2 font-normal tracking-normal normal-case text-primary/40">
                        {band.range}
                      </span>
                    </span>
                    <span className="font-display text-lg text-foreground tabular-nums">
                      {count}
                      <span className="text-primary/40 text-sm ml-2">
                        {Math.round(share * 100)}%
                      </span>
                    </span>
                  </div>
                  <div className="h-2 w-full bg-primary/5 overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all duration-500",
                        band.key === "secure" ? "bg-primary" : "bg-foreground",
                        isActive ? "opacity-100" : "opacity-80 group-hover:opacity-100"
                      )}
                      style={{ width: `${Math.max(share * 100, count > 0 ? 2 : 0)}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-primary/15 grid grid-cols-1 sm:grid-cols-3">
        <div className="px-4 sm:px-6 md:px-10 py-5 sm:border-r border-primary/15">
          <div className="text-[10px] font-bold tracking-[0.25em] uppercase text-accent mb-2">
            Median score
          </div>
          <div className="font-display text-3xl text-foreground leading-none tabular-nums">
            {pct(medianScore)}
          </div>
        </div>
        <div className="px-4 sm:px-6 md:px-10 py-5 sm:border-r border-primary/15 border-t sm:border-t-0">
          <div className="text-[10px] font-bold tracking-[0.25em] uppercase text-accent mb-2">
            Completion rate
          </div>
          <div className="font-display text-3xl text-foreground leading-none tabular-nums">
            {pct(completionRate)}
          </div>
        </div>
        <div className="px-4 sm:px-6 md:px-10 py-5 border-t sm:border-t-0">
          <div className="text-[10px] font-bold tracking-[0.25em] uppercase text-accent mb-2">
            Responses this term
          </div>
          <div className="font-display text-3xl text-foreground leading-none tabular-nums">
            {responseCount}
          </div>
        </div>
      </div>
    </section>
  );
};
