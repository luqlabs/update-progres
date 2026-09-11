import { useState } from "react";
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

interface FlashcardsEditorProps {
  config: AppConfig;
  onConfigUpdate: (config: AppConfig) => void;
}

export const FlashcardsEditor = ({ config, onConfigUpdate }: FlashcardsEditorProps) => {
  const [selectedCardIndex, setSelectedCardIndex] = useState<number>(0);
  const [editedFront, setEditedFront] = useState(config.cards?.[0]?.front || "");
  const [editedBack, setEditedBack] = useState(config.cards?.[0]?.back || "");
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);

  const cards = config.cards || [];

  const handleCardSelect = (index: number) => {
    setSelectedCardIndex(index);
    setEditedFront(cards[index]?.front || "");
    setEditedBack(cards[index]?.back || "");
  };

  const handleSaveCard = () => {
    if (!config.cards) return;

    const updatedCards = [...config.cards];
    updatedCards[selectedCardIndex] = {
      ...updatedCards[selectedCardIndex],
      front: editedFront,
      back: editedBack,
    };

    onConfigUpdate({ ...config, cards: updatedCards });
    toast.success("Card saved");
  };

  const handleAddCard = () => {
    const newCard = {
      front: "New flashcard front",
      back: "New flashcard back",
      difficulty: 0,
      nextReview: new Date(),
    };

    const updatedCards = [...cards, newCard];
    onConfigUpdate({ ...config, cards: updatedCards });

    setSelectedCardIndex(updatedCards.length - 1);
    setEditedFront(newCard.front);
    setEditedBack(newCard.back);
    toast.success("New card added");
  };

  const handleDeleteCard = (index: number) => {
    if (cards.length <= 1) {
      toast.error("Cannot delete the last card");
      setDeleteConfirmIndex(null);
      return;
    }

    const updatedCards = cards.filter((_, i) => i !== index);
    onConfigUpdate({ ...config, cards: updatedCards });

    const newIndex = Math.min(selectedCardIndex, updatedCards.length - 1);
    setSelectedCardIndex(newIndex);
    setEditedFront(updatedCards[newIndex]?.front || "");
    setEditedBack(updatedCards[newIndex]?.back || "");
    setDeleteConfirmIndex(null);
    toast.success("Card deleted");
  };

  const handleDuplicateCard = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const cardToDuplicate = { ...cards[index] };
    const updatedCards = [
      ...cards.slice(0, index + 1),
      cardToDuplicate,
      ...cards.slice(index + 1),
    ];

    onConfigUpdate({ ...config, cards: updatedCards });
    setSelectedCardIndex(index + 1);
    setEditedFront(cardToDuplicate.front || "");
    setEditedBack(cardToDuplicate.back || "");
    toast.success("Card duplicated");
  };

  const handleMoveCard = (index: number, direction: "up" | "down", e: React.MouseEvent) => {
    e.stopPropagation();
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= cards.length) return;

    const updatedCards = [...cards];
    [updatedCards[index], updatedCards[newIndex]] = [updatedCards[newIndex], updatedCards[index]];

    onConfigUpdate({ ...config, cards: updatedCards });
    setSelectedCardIndex(newIndex);
    setEditedFront(updatedCards[newIndex]?.front || "");
    setEditedBack(updatedCards[newIndex]?.back || "");
    toast.success(`Card moved ${direction}`);
  };

  if (cards.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="text-center text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="mb-4">No flashcards yet. Add your first card!</p>
          <Button onClick={handleAddCard}>
            <Plus className="w-4 h-4 mr-2" />
            Add Card
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
            <h2 className="text-sm font-semibold">Flashcards</h2>
            <p className="text-xs text-muted-foreground">{cards.length} total</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleAddCard}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add
          </Button>
        </div>
        <div className="overflow-x-auto">
          <div className="flex gap-2 p-2 min-w-min">
            {cards.map((card, index) => (
              <button
                key={index}
                onClick={() => handleCardSelect(index)}
                className={`flex-shrink-0 flex flex-col items-start gap-1 p-2 rounded-lg min-w-[100px] max-w-[140px] transition-colors ${
                  selectedCardIndex === index
                    ? "bg-primary/10 border-2 border-primary"
                    : "bg-muted/50 hover:bg-muted border-2 border-transparent"
                }`}
              >
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  C{index + 1}
                </Badge>
                <p className="text-xs line-clamp-1 text-left w-full">{card.front || "(no text)"}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-1 px-2 py-1.5 border-t border-border/50 bg-muted/30">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={(e) => handleMoveCard(selectedCardIndex, "up", e)}
            disabled={selectedCardIndex === 0}
          >
            <ChevronUp className="w-3.5 h-3.5 mr-1" />
            Up
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={(e) => handleMoveCard(selectedCardIndex, "down", e)}
            disabled={selectedCardIndex === cards.length - 1}
          >
            <ChevronDown className="w-3.5 h-3.5 mr-1" />
            Down
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={(e) => handleDuplicateCard(selectedCardIndex, e)}
          >
            <Copy className="w-3.5 h-3.5 mr-1" />
            Copy
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-destructive hover:text-destructive"
            onClick={() => setDeleteConfirmIndex(selectedCardIndex)}
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
            <h2 className="text-lg font-semibold">Flashcards</h2>
            <p className="text-sm text-muted-foreground">{cards.length} total</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleAddCard}>
            <Plus className="w-4 h-4 mr-1" />
            Add Card
          </Button>
        </div>

        <ScrollArea className="flex-1" type="always">
          <div className="p-2 pr-4">
            {cards.map((card, index) => (
              <div
                key={index}
                onClick={() => handleCardSelect(index)}
                className={`group relative w-full text-left p-3 rounded-lg mb-2 transition-colors cursor-pointer ${
                  selectedCardIndex === index
                    ? "bg-primary/10 border-2 border-primary"
                    : "bg-muted/50 hover:bg-muted border-2 border-transparent"
                }`}
              >
                <div className="flex items-start gap-2 mb-1 pr-16">
                  <Badge variant="outline" className="text-xs shrink-0">
                    C{index + 1}
                  </Badge>
                </div>
                <p className="text-sm line-clamp-2 mt-1 pr-16 font-medium">{card.front || "(no text)"}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1 pr-16">{card.back}</p>

                <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => handleMoveCard(index, "up", e)}
                    disabled={index === 0}
                    title="Move up"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => handleMoveCard(index, "down", e)}
                    disabled={index === cards.length - 1}
                    title="Move down"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => handleDuplicateCard(index, e)}
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
            <h3 className="text-lg font-semibold">Edit Card {selectedCardIndex + 1}</h3>

            <div>
              <Label htmlFor="front">Front</Label>
              <Textarea
                id="front"
                value={editedFront}
                onChange={(e) => setEditedFront(e.target.value)}
                placeholder="Front of the card"
                className="min-h-[100px] mt-1"
              />
            </div>

            <div>
              <Label htmlFor="back">Back</Label>
              <Textarea
                id="back"
                value={editedBack}
                onChange={(e) => setEditedBack(e.target.value)}
                placeholder="Back of the card"
                className="min-h-[100px] mt-1"
              />
            </div>

            <Button onClick={handleSaveCard}>Save Card</Button>
          </div>
        </ScrollArea>
      </div>

      <AlertDialog
        open={deleteConfirmIndex !== null}
        onOpenChange={(open) => !open && setDeleteConfirmIndex(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this card?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The flashcard will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmIndex !== null && handleDeleteCard(deleteConfirmIndex)}
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
