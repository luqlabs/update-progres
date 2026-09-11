import { useState } from "react";
import { ChevronRight, Pencil, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface DraftApp {
  id: string;
  title: string;
  updated_at: string;
}

interface DraftsGroupProps {
  drafts: DraftApp[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const DraftsGroup = ({ drafts, onEdit, onDelete }: DraftsGroupProps) => {
  const [open, setOpen] = useState(false);

  if (drafts.length === 0) return null;

  return (
    <div className="border border-primary/15 mb-6">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 hover:bg-accent/5 transition-colors"
      >
        <span className="flex items-center gap-2.5 text-[11px] font-semibold tracking-[0.2em] uppercase text-primary/60">
          <ChevronRight
            className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-90")}
          />
          Drafts
        </span>
        <span className="text-[11px] font-semibold tracking-[0.16em] uppercase text-primary/40">
          {drafts.length} unfinished
        </span>
      </button>

      {open && (
        <div className="border-t border-primary/15">
          {drafts.map(draft => (
            <div
              key={draft.id}
              className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b last:border-b-0 border-primary/10"
            >
              <div className="min-w-0">
                <div className="text-sm text-foreground truncate">{draft.title}</div>
                <div className="text-xs text-muted-foreground">
                  Last edited {formatDistanceToNow(new Date(draft.updated_at), { addSuffix: true })}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => onEdit(draft.id)}>
                  <Pencil className="w-3.5 h-3.5 mr-1" />
                  Continue
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(draft.id)}
                  aria-label={`Delete ${draft.title}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
