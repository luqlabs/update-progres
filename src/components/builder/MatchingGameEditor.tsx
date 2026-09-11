import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, Plus, Copy, ChevronUp, ChevronDown, FileText } from "lucide-react";
import { AppConfig } from "@/pages/Builder";
import { toast } from "sonner";

interface MatchingGameEditorProps {
  config: AppConfig;
  onConfigUpdate: (config: AppConfig) => void;
}

export const MatchingGameEditor = ({ config, onConfigUpdate }: MatchingGameEditorProps) => {
  const [selectedPairIndex, setSelectedPairIndex] = useState<number>(0);
  const [editedPrompt, setEditedPrompt] = useState(config.pairs?.[0]?.prompt || "");
  const [editedAnswer, setEditedAnswer] = useState(config.pairs?.[0]?.answer || "");
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);

  const pairs = config.pairs || [];

  // Sync local state when config.pairs changes externally (e.g., from AI chat)
  useEffect(() => {
    if (pairs.length === 0) {
      setEditedPrompt("");
      setEditedAnswer("");
      return;
    }

    let validIndex = selectedPairIndex;
    if (selectedPairIndex >= pairs.length) {
      validIndex = pairs.length - 1;
      setSelectedPairIndex(validIndex);
    }

    setEditedPrompt(pairs[validIndex]?.prompt || "");
    setEditedAnswer(pairs[validIndex]?.answer || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.pairs, selectedPairIndex]);

  const handlePairSelect = (index: number) => {
    setSelectedPairIndex(index);
    setEditedPrompt(pairs[index]?.prompt || "");
    setEditedAnswer(pairs[index]?.answer || "");
  };

  const handleSavePair = () => {
    if (!config.pairs) return;

    const updatedPairs = [...config.pairs];
    updatedPairs[selectedPairIndex] = {
      ...updatedPairs[selectedPairIndex],
      prompt: editedPrompt,
      answer: editedAnswer,
    };

    onConfigUpdate({ ...config, pairs: updatedPairs });
    toast.success("Pair saved");
  };

  const handleAddPair = () => {
    const newPair = { prompt: "New prompt", answer: "New answer" };
    const updatedPairs = [...pairs, newPair];
    onConfigUpdate({ ...config, pairs: updatedPairs });

    setSelectedPairIndex(updatedPairs.length - 1);
    setEditedPrompt(newPair.prompt);
    setEditedAnswer(newPair.answer);
    toast.success("New pair added");
  };

  const handleDeletePair = (index: number) => {
    if (pairs.length <= 1) {
      toast.error("Cannot delete the last pair");
      setDeleteConfirmIndex(null);
      return;
    }

    const updatedPairs = pairs.filter((_, i) => i !== index);
    onConfigUpdate({ ...config, pairs: updatedPairs });

    const newIndex = Math.min(selectedPairIndex, updatedPairs.length - 1);
    setSelectedPairIndex(newIndex);
    setEditedPrompt(updatedPairs[newIndex]?.prompt || "");
    setEditedAnswer(updatedPairs[newIndex]?.answer || "");
    setDeleteConfirmIndex(null);
    toast.success("Pair deleted");
  };

  const handleDuplicatePair = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const pairToDuplicate = { ...pairs[index] };
    const updatedPairs = [
      ...pairs.slice(0, index + 1),
      pairToDuplicate,
      ...pairs.slice(index + 1),
    ];

    onConfigUpdate({ ...config, pairs: updatedPairs });
    setSelectedPairIndex(index + 1);
    setEditedPrompt(pairToDuplicate.prompt || "");
    setEditedAnswer(pairToDuplicate.answer || "");
    toast.success("Pair duplicated");
  };

  const handleMovePair = (index: number, direction: "up" | "down", e: React.MouseEvent) => {
    e.stopPropagation();
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= pairs.length) return;

    const updatedPairs = [...pairs];
    [updatedPairs[index], updatedPairs[newIndex]] = [updatedPairs[newIndex], updatedPairs[index]];

    onConfigUpdate({ ...config, pairs: updatedPairs });
    setSelectedPairIndex(newIndex);
    setEditedPrompt(updatedPairs[newIndex]?.prompt || "");
    setEditedAnswer(updatedPairs[newIndex]?.answer || "");
    toast.success(`Pair moved ${direction}`);
  };

  if (pairs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="text-center text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="mb-4">No matching pairs yet. Add your first pair!</p>
          <Button onClick={handleAddPair}>
            <Plus className="w-4 h-4 mr-2" />
            Add Pair
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-full w-full bg-background">
      {/* Horizontal slider — mobile/tablet */}
      <div className="md:hidden border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
          <div>
            <h2 className="text-sm font-semibold">Matching pairs</h2>
            <p className="text-xs text-muted-foreground">{pairs.length} total</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleAddPair}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add
          </Button>
        </div>
        <div className="overflow-x-auto">
          <div className="flex gap-2 p-2 min-w-min">
            {pairs.map((pair, index) => (
              <button
                key={index}
                onClick={() => handlePairSelect(index)}
                className={`flex-shrink-0 flex flex-col items-start gap-1 p-2 rounded-lg min-w-[100px] max-w-[140px] transition-colors ${
                  selectedPairIndex === index
                    ? "bg-primary/10 border-2 border-primary"
                    : "bg-muted/50 hover:bg-muted border-2 border-transparent"
                }`}
              >
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  P{index + 1}
                </Badge>
                <p className="text-xs line-clamp-1 text-left w-full">{pair.prompt || "(no text)"}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-1 px-2 py-1.5 border-t border-border/50 bg-muted/30">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={(e) => handleMovePair(selectedPairIndex, "up", e)}
            disabled={selectedPairIndex === 0}
          >
            <ChevronUp className="w-3.5 h-3.5 mr-1" />
            Up
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={(e) => handleMovePair(selectedPairIndex, "down", e)}
            disabled={selectedPairIndex === pairs.length - 1}
          >
            <ChevronDown className="w-3.5 h-3.5 mr-1" />
            Down
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={(e) => handleDuplicatePair(selectedPairIndex, e)}
          >
            <Copy className="w-3.5 h-3.5 mr-1" />
            Copy
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-destructive hover:text-destructive"
            onClick={() => setDeleteConfirmIndex(selectedPairIndex)}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      {/* Left panel — desktop */}
      <div className="hidden md:flex w-[30%] border-r border-border flex-col">
        <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Matching pairs</h2>
            <p className="text-sm text-muted-foreground">{pairs.length} total</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleAddPair}>
            <Plus className="w-4 h-4 mr-1" />
            Add Pair
          </Button>
        </div>

        <ScrollArea className="flex-1" type="always">
          <div className="p-2 pr-4">
            {pairs.map((pair, index) => (
              <div
                key={index}
                onClick={() => handlePairSelect(index)}
                className={`group relative w-full text-left p-3 rounded-lg mb-2 transition-colors cursor-pointer ${
                  selectedPairIndex === index
                    ? "bg-primary/10 border-2 border-primary"
                    : "bg-muted/50 hover:bg-muted border-2 border-transparent"
                }`}
              >
                <div className="flex items-start gap-2 mb-1 pr-16">
                  <Badge variant="outline" className="text-xs shrink-0">
                    P{index + 1}
                  </Badge>
                </div>
                <p className="text-sm line-clamp-2 mt-1 pr-16 font-medium">{pair.prompt || "(no text)"}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1 pr-16">{pair.answer}</p>

                <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => handleMovePair(index, "up", e)}
                    disabled={index === 0}
                    title="Move up"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => handleMovePair(index, "down", e)}
                    disabled={index === pairs.length - 1}
                    title="Move down"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => handleDuplicatePair(index, e)}
                    title="Duplicate"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmIndex(index);
                    }}
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Right panel — editor */}
      <div className="flex-1 min-w-0">
        <ScrollArea className="h-full">
          <div className="p-4 md:p-6 space-y-4 max-w-3xl">
            <h3 className="text-lg font-semibold">Edit Pair {selectedPairIndex + 1}</h3>

            <div>
              <Label htmlFor="prompt">Prompt</Label>
              <Textarea
                id="prompt"
                value={editedPrompt}
                onChange={(e) => setEditedPrompt(e.target.value)}
                placeholder="Prompt text"
                className="min-h-[100px] mt-1"
              />
            </div>

            <div>
              <Label htmlFor="answer">Answer</Label>
              <Textarea
                id="answer"
                value={editedAnswer}
                onChange={(e) => setEditedAnswer(e.target.value)}
                placeholder="Answer text"
                className="min-h-[100px] mt-1"
              />
            </div>

            <Button onClick={handleSavePair}>Save Pair</Button>
          </div>
        </ScrollArea>
      </div>

      <AlertDialog
        open={deleteConfirmIndex !== null}
        onOpenChange={(open) => !open && setDeleteConfirmIndex(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this pair?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The matching pair will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmIndex !== null && handleDeletePair(deleteConfirmIndex)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
