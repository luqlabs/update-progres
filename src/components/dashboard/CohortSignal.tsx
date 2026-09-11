import { ArrowUpRight } from "lucide-react";
import { format } from "date-fns";

export interface LowestScoringApp {
  id: string;
  title: string;
  avg_score: number; // 0..1 or 0..100 — we normalize on render
  total_plays: number;
}

interface CohortSignalProps {
  firstName: string;
  activityCount: number;
  newThisMonth: number;
  studentsReached: number;
  cohortsCount: number;
  lowestScoringApp: LowestScoringApp | null;
  weeklyActivity?: number[];
  recentResponses?: number;
  onGapClick: (appId: string) => void;
  onThisTermClick?: () => void;
}

const partOfDay = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

const formatScore = (score: number) => {
  const pct = score <= 1 ? Math.round(score * 100) : Math.round(score);
  return `${pct}%`;
};

const Sparkline = ({ values }: { values: number[] }) => {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-1 h-8 mt-4" aria-hidden="true">
      {values.map((v, i) => (
        <div
          key={i}
          className="w-2 bg-primary/25 last:bg-primary transition-all"
          style={{ height: `${Math.max((v / max) * 100, 6)}%` }}
          title={`${v} responses`}
        />
      ))}
    </div>
  );
};


export const CohortSignal = ({
  firstName,
  activityCount,
  newThisMonth,
  studentsReached,
  cohortsCount,
  lowestScoringApp,
  weeklyActivity,
  recentResponses = 0,
  onGapClick,
  onThisTermClick,
}: CohortSignalProps) => {
  const isEmpty = activityCount === 0;


  return (
    <section className="border border-primary/15 bg-card/60 animate-fade-in">
      {/* Header row */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 px-4 sm:px-6 md:px-10 pt-6 md:pt-8 pb-6">
        <div className="min-w-0">
          <h1 className="font-display italic text-2xl sm:text-3xl md:text-4xl leading-tight text-foreground break-words">
            {partOfDay()}, {firstName}.
          </h1>

          <p className="mt-2 text-[10px] font-semibold tracking-[0.22em] uppercase text-primary/60">
            {format(new Date(), "EEEE, d MMMM")}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-primary/15" />

      {/* Three tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3">
        {/* Tile 01 */}
        <button
          type="button"
          onClick={() => onThisTermClick?.()}
          disabled={isEmpty || !onThisTermClick}
          className="p-4 sm:p-6 md:p-10 md:border-r border-primary/15 min-w-0 text-left disabled:cursor-default enabled:hover:bg-accent/5 transition-colors"
        >
          <div className="text-[10px] font-bold tracking-[0.25em] uppercase text-accent mb-4">
            01. This term
          </div>
          {isEmpty ? (
            <p className="text-sm text-primary/60 leading-relaxed max-w-xs">
              Once you create your first quiz, you'll see term-wide activity here.
            </p>
          ) : (
            <>
              <div className="font-display text-5xl md:text-6xl text-primary leading-none">
                {activityCount}
              </div>
              <div className="mt-3 text-sm text-primary/70">
                {activityCount === 1 ? "activity" : "activities"}
                {newThisMonth > 0 && (
                  <>
                    <span className="text-primary/30"> · </span>
                    <span className="text-primary/70">{newThisMonth} new this month</span>
                  </>
                )}
              </div>
              {weeklyActivity && weeklyActivity.some(v => v > 0) && (
                <Sparkline values={weeklyActivity} />
              )}
            </>
          )}
        </button>

        {/* Tile 02 */}
        <div className="p-4 sm:p-6 md:p-10 md:border-r border-primary/15 border-t md:border-t-0 min-w-0">
          <div className="text-[10px] font-bold tracking-[0.25em] uppercase text-accent mb-4">
            02. Students reached
          </div>
          {isEmpty || studentsReached === 0 ? (
            <p className="text-sm text-primary/60 leading-relaxed max-w-xs">
              Share a link — student responses show up here as they come in.
            </p>
          ) : (
            <>
              <div className="font-display text-5xl md:text-6xl text-primary leading-none">
                {studentsReached}
              </div>
              <div className="mt-3 text-sm text-primary/70">
                unique responses
                {cohortsCount > 0 && (
                  <>
                    <span className="text-primary/30"> · </span>
                    <span className="text-primary/70">
                      across {cohortsCount} {cohortsCount === 1 ? "activity" : "activities"}
                    </span>
                  </>
                )}
              </div>
              {recentResponses > 0 && (
                <div className="mt-4 text-[10px] font-semibold tracking-[0.2em] uppercase text-primary">
                  +{recentResponses} in the last 7 days
                </div>
              )}
            </>
          )}
        </div>


        {/* Tile 03 */}
        <button
          type="button"
          onClick={() => lowestScoringApp && onGapClick(lowestScoringApp.id)}
          disabled={!lowestScoringApp}
          className="p-4 sm:p-6 md:p-10 border-t md:border-t-0 text-left group relative disabled:cursor-default enabled:hover:bg-accent/5 transition-colors min-w-0"
        >
          <div className="text-[10px] font-bold tracking-[0.25em] uppercase text-accent mb-4 flex items-center justify-between">
            <span>03. Latest gap</span>
            {lowestScoringApp && (
              <ArrowUpRight className="w-4 h-4 text-primary/40 group-hover:text-primary transition-colors" />
            )}
          </div>
          {!lowestScoringApp ? (
            <p className="text-sm text-primary/60 leading-relaxed max-w-xs">
              After a few responses, we'll surface the topic students struggle with most.
            </p>
          ) : (
            <>
              <div className="font-display italic text-xl sm:text-2xl md:text-3xl text-primary leading-tight line-clamp-2 break-words">
                {lowestScoringApp.title}
              </div>
              <div className="mt-3 text-sm text-primary/70">
                avg. {formatScore(lowestScoringApp.avg_score)}
                <span className="text-primary/30"> · </span>
                <span>
                  {lowestScoringApp.total_plays}{" "}
                  {lowestScoringApp.total_plays === 1 ? "response" : "responses"}
                </span>
              </div>
              <div className="mt-4 text-[10px] font-semibold tracking-[0.2em] uppercase text-primary/60 group-hover:text-primary transition-colors">
                Review question breakdown
              </div>

            </>
          )}
        </button>
      </div>
    </section>
  );
};
