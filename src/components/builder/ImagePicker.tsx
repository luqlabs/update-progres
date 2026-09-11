import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ImageIcon, X } from "lucide-react";
import { QuizMediaLibraryDialog } from "./QuizMediaLibraryDialog";

interface ImagePickerProps {
  value?: string | null;
  onChange: (imageUrl: string | null) => void;
  label?: string;
  compact?: boolean;
}

export function ImagePicker({ value, onChange, label, compact = false }: ImagePickerProps) {
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);

  const handleSelect = (imageUrl: string) => {
    onChange(imageUrl);
    setShowMediaLibrary(false);
  };

  const handleRemove = () => {
    onChange(null);
  };

  if (compact) {
    return (
      <>
        {value ? (
          <div className="relative w-10 h-10 rounded border border-border overflow-hidden group">
            <img
              src={value}
              alt="Option image"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg";
              }}
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="w-10 h-10 shrink-0"
            onClick={() => setShowMediaLibrary(true)}
          >
            <ImageIcon className="w-4 h-4" />
          </Button>
        )}

        <QuizMediaLibraryDialog
          open={showMediaLibrary}
          onClose={() => setShowMediaLibrary(false)}
          onSelect={handleSelect}
        />
      </>
    );
  }

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium">{label}</p>}
      
      {value ? (
        <div className="relative inline-block">
          <div className="relative w-full max-w-[200px] aspect-video rounded-lg border border-border overflow-hidden">
            <img
              src={value}
              alt="Question image"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg";
              }}
            />
          </div>
          <div className="flex gap-2 mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowMediaLibrary(true)}
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Change
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
            >
              <X className="w-4 h-4 mr-2" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowMediaLibrary(true)}
          className="w-full max-w-[200px] h-20 flex flex-col items-center justify-center gap-1 border-dashed"
        >
          <ImageIcon className="w-5 h-5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Add Image</span>
        </Button>
      )}

      <QuizMediaLibraryDialog
        open={showMediaLibrary}
        onClose={() => setShowMediaLibrary(false)}
        onSelect={handleSelect}
      />
    </div>
  );
}
