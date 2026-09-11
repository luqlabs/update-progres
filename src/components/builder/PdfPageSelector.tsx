import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { extractPdfPagePreviews } from "@/lib/documentParser";

interface PagePreview {
  pageNum: number;
  dataUrl: string;
}

interface PdfPageSelectorProps {
  file: File;
  open: boolean;
  onConfirm: (selectedPages: number[]) => void;
  onCancel: () => void;
}

export default function PdfPageSelector({ file, open, onConfirm, onCancel }: PdfPageSelectorProps) {
  const [previews, setPreviews] = useState<PagePreview[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    if (!open || !file) return;
    
    let cancelled = false;
    setLoading(true);
    setPreviews([]);
    setSelectedPages(new Set());

    extractPdfPagePreviews(file).then((results) => {
      if (cancelled) return;
      setPreviews(results);
      setTotalPages(results.length);
      setSelectedPages(new Set(results.map((p) => p.pageNum)));
      setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [file, open]);

  const togglePage = useCallback((pageNum: number) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageNum)) next.delete(pageNum);
      else next.add(pageNum);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (selectedPages.size === totalPages) {
      setSelectedPages(new Set());
    } else {
      setSelectedPages(new Set(previews.map((p) => p.pageNum)));
    }
  }, [selectedPages.size, totalPages, previews]);

  const allSelected = totalPages > 0 && selectedPages.size === totalPages;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] grid-rows-[auto_auto_minmax(0,1fr)_auto]">
        <DialogHeader>
          <DialogTitle>Select PDF Pages</DialogTitle>
          <DialogDescription>
            Choose which pages to use for quiz generation
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 px-1">
          <Checkbox
            checked={allSelected}
            onCheckedChange={toggleAll}
            id="select-all"
          />
          <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
            {allSelected ? "Deselect All" : "Select All"}
          </label>
          <span className="text-xs text-muted-foreground ml-auto">
            {selectedPages.size} of {totalPages} pages selected
          </span>
        </div>

        <ScrollArea className="min-h-0 h-full max-h-[60vh] border rounded-md p-3">
          {loading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4] w-full rounded-md" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {previews.map((preview) => {
                const isSelected = selectedPages.has(preview.pageNum);
                return (
                  <button
                    key={preview.pageNum}
                    type="button"
                    onClick={() => togglePage(preview.pageNum)}
                    className={`relative group rounded-md overflow-hidden border-2 transition-colors ${
                      isSelected
                        ? "border-primary ring-1 ring-primary/30"
                        : "border-border hover:border-muted-foreground/40"
                    }`}
                  >
                    <img
                      src={preview.dataUrl}
                      alt={`Page ${preview.pageNum}`}
                      className="w-full aspect-[3/4] object-cover bg-muted"
                    />
                    <div className="absolute top-1 left-1">
                      <Checkbox
                        checked={isSelected}
                        tabIndex={-1}
                        className="pointer-events-none bg-background/80"
                      />
                    </div>
                    <span className="absolute bottom-0 inset-x-0 text-center text-[10px] font-medium bg-background/80 py-0.5">
                      {preview.pageNum}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button
            onClick={() => onConfirm(Array.from(selectedPages))}
            disabled={selectedPages.size === 0 || loading}
          >
            Use {selectedPages.size} of {totalPages} pages
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
