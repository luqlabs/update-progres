import { ArrowUpRight } from "lucide-react";

export interface AttentionItem {
  id: string;
  eyebrow: string;
  title: string;
  action: string;
  onClick: () => void;
}

interface NeedsAttentionProps {
  items: AttentionItem[];
}

export const NeedsAttention = ({ items }: NeedsAttentionProps) => {
  if (items.length === 0) return null;

  return (
    <section className="border border-primary/15 bg-card/60">
      <div className="px-4 sm:px-6 md:px-10 pt-5 pb-4">
        <div className="text-[10px] font-bold tracking-[0.25em] uppercase text-accent">
          Needs your attention
        </div>
      </div>
      <div className="border-t border-primary/15">
        {items.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={item.onClick}
            className="w-full text-left px-4 sm:px-6 md:px-10 py-4 border-b last:border-b-0 border-primary/10 hover:bg-accent/5 transition-colors group"
          >
            <div className="flex items-center justify-between gap-4 min-w-0">
              <div className="min-w-0">
                <div className="text-[10px] font-semibold tracking-[0.2em] uppercase text-primary/45 mb-1">
                  {item.eyebrow}
                </div>
                <div className="font-display italic text-lg md:text-xl text-foreground truncate">
                  {item.title}
                </div>
              </div>
              <span className="shrink-0 flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.16em] uppercase text-primary/60 group-hover:text-primary transition-colors">
                {item.action}
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};
