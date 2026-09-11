import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Folder, Briefcase, BookOpen, GraduationCap, Users, Lightbulb, Target, Award } from "lucide-react";

const folderIcons = [
  { value: "folder", icon: Folder, label: "Folder" },
  { value: "briefcase", icon: Briefcase, label: "Briefcase" },
  { value: "book", icon: BookOpen, label: "Book" },
  { value: "graduation", icon: GraduationCap, label: "Graduation" },
  { value: "users", icon: Users, label: "Users" },
  { value: "lightbulb", icon: Lightbulb, label: "Lightbulb" },
  { value: "target", icon: Target, label: "Target" },
  { value: "award", icon: Award, label: "Award" },
];

const folderColors = [
  { value: "blue", class: "bg-blue-500", label: "Blue" },
  { value: "green", class: "bg-green-500", label: "Green" },
  { value: "purple", class: "bg-purple-500", label: "Purple" },
  { value: "orange", class: "bg-orange-500", label: "Orange" },
  { value: "red", class: "bg-red-500", label: "Red" },
  { value: "pink", class: "bg-pink-500", label: "Pink" },
  { value: "yellow", class: "bg-yellow-500", label: "Yellow" },
  { value: "indigo", class: "bg-indigo-500", label: "Indigo" },
];

interface FolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (folder: { name: string; color: string; icon: string }) => Promise<void>;
  folder?: { id: string; name: string; color: string; icon: string } | null;
}

export function FolderDialog({ open, onOpenChange, onSave, folder }: FolderDialogProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("blue");
  const [icon, setIcon] = useState("folder");
  const [isLoading, setIsLoading] = useState(false);

  // Sync state when folder prop changes (for edit mode)
  useEffect(() => {
    if (folder) {
      setName(folder.name);
      setColor(folder.color);
      setIcon(folder.icon);
    } else {
      setName("");
      setColor("blue");
      setIcon("folder");
    }
  }, [folder]);

  const handleSave = async () => {
    if (!name.trim()) return;
    
    setIsLoading(true);
    try {
      await onSave({ name: name.trim(), color, icon });
      onOpenChange(false);
      setName("");
      setColor("blue");
      setIcon("folder");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedIconData = folderIcons.find(i => i.value === icon);
  const SelectedIcon = selectedIconData?.icon || Folder;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{folder ? "Edit Folder" : "Create New Folder"}</DialogTitle>
          <DialogDescription>
            {folder ? "Update your folder details" : "Organize your activities into folders"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="folder-name">Folder Name</Label>
            <Input
              id="folder-name"
              placeholder="e.g., Math Class, Science Projects"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <Label>Folder Icon</Label>
            <div className="grid grid-cols-4 gap-2">
              {folderIcons.map((iconOption) => {
                const IconComponent = iconOption.icon;
                return (
                  <button
                    key={iconOption.value}
                    type="button"
                    onClick={() => setIcon(iconOption.value)}
                    className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                      icon === iconOption.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <IconComponent className="w-5 h-5 mx-auto" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Folder Color</Label>
            <div className="grid grid-cols-4 gap-2">
              {folderColors.map((colorOption) => (
                <button
                  key={colorOption.value}
                  type="button"
                  onClick={() => setColor(colorOption.value)}
                  className={`h-10 rounded-lg border-2 transition-all hover:scale-105 ${
                    colorOption.class
                  } ${
                    color === colorOption.value
                      ? "border-foreground ring-2 ring-offset-2 ring-foreground/20"
                      : "border-transparent hover:border-foreground/30"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Preview:</p>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-md ${folderColors.find(c => c.value === color)?.class} flex items-center justify-center`}>
                <SelectedIcon className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium">{name || "Folder Name"}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || isLoading}>
            {isLoading ? "Saving..." : folder ? "Save Changes" : "Create Folder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
