import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useFeatures } from "@/hooks/useFeatures";

interface QuizMediaLibraryDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string) => void;
}

export function QuizMediaLibraryDialog({
  open,
  onClose,
  onSelect,
}: QuizMediaLibraryDialogProps) {
  const [uploading, setUploading] = useState(false);
  const [libraryImages, setLibraryImages] = useState<string[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageMax, setStorageMax] = useState<number | 'unlimited'>(50);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { canUploadStorage, getStorageUsage } = useFeatures();

  // Fetch existing images and storage usage when dialog opens
  useEffect(() => {
    if (open) {
      fetchExistingImages();
      loadStorageUsage();
    }
  }, [open]);

  const loadStorageUsage = async () => {
    const usage = await getStorageUsage();
    setStorageUsed(usage.usedMB);
    setStorageMax(usage.maxMB);
  };

  const fetchExistingImages = async () => {
    setLoadingLibrary(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: files, error } = await supabase.storage
        .from("quiz-media")
        .list(user.id, { limit: 100, sortBy: { column: "created_at", order: "desc" } });

      if (error) throw error;

      const imageUrls = files
        ?.filter(file => file.name !== ".emptyFolderPlaceholder")
        .map(file => {
          const { data: { publicUrl } } = supabase.storage
            .from("quiz-media")
            .getPublicUrl(`${user.id}/${file.name}`);
          return publicUrl;
        }) || [];

      setLibraryImages(imageUrls);
    } catch (error: any) {
      console.error("Error fetching images:", error);
    } finally {
      setLoadingLibrary(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const newImages: string[] = [];

      for (const file of Array.from(files)) {
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`File ${file.name} is too large. Max size is 5MB.`);
          continue;
        }

        // Check storage limit
        const canUpload = await canUploadStorage(file.size);
        if (!canUpload) {
          toast.error(`Storage limit reached. Upgrade your plan for more space.`);
          break;
        }

        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("quiz-media")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("quiz-media").getPublicUrl(filePath);

        newImages.push(publicUrl);
      }

      // Add new images to library and select the first one
      setLibraryImages(prev => [...newImages, ...prev]);
      
      if (newImages.length > 0) {
        setSelectedImage(newImages[0]);
        toast.success("Image uploaded successfully");
        // Refresh storage usage
        loadStorageUsage();
      }
    } catch (error: any) {
      console.error("Error uploading files:", error);
      toast.error(error.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSelect = () => {
    if (selectedImage) {
      onSelect(selectedImage);
      setSelectedImage(null);
      onClose();
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onSelect(urlInput.trim());
      setUrlInput("");
      onClose();
    }
  };

  const handleDeleteImage = async (imageUrl: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Extract file path from URL
      const urlParts = imageUrl.split("/quiz-media/");
      if (urlParts.length < 2) throw new Error("Invalid image URL");
      
      const filePath = decodeURIComponent(urlParts[1]);

      const { error } = await supabase.storage
        .from("quiz-media")
        .remove([filePath]);

      if (error) throw error;

      setLibraryImages(prev => prev.filter(url => url !== imageUrl));
      if (selectedImage === imageUrl) {
        setSelectedImage(null);
      }
      toast.success("Image deleted");
      // Refresh storage usage
      loadStorageUsage();
    } catch (error: any) {
      console.error("Error deleting image:", error);
      toast.error("Failed to delete image");
    }
  };

  const filteredImages = libraryImages.filter(url => 
    url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const defaultTab = libraryImages.length > 0 ? "library" : "upload";
  const storagePercentage = storageMax === 'unlimited' ? 0 : (storageUsed / storageMax) * 100;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Image</DialogTitle>
          {/* Storage Usage Indicator */}
          <div className="space-y-1 pt-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Storage Used</span>
              <span>{storageUsed.toFixed(2)} / {storageMax === 'unlimited' ? '∞' : `${storageMax} MB`}</span>
            </div>
            {storageMax !== 'unlimited' && (
              <Progress value={storagePercentage} className="h-1.5" />
            )}
          </div>
        </DialogHeader>

        <Tabs defaultValue={defaultTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="library">Library</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="url">From URL</TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="flex-1 flex flex-col mt-4 space-y-4 overflow-hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search images..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              {loadingLibrary ? (
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-square rounded-lg" />
                  ))}
                </div>
              ) : filteredImages.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {filteredImages.map((url, index) => (
                    <div key={index} className="relative group">
                      <button
                        type="button"
                        onClick={() => setSelectedImage(url)}
                        className={`w-full aspect-square bg-muted rounded-lg overflow-hidden border-2 transition-all hover:border-primary ${
                          selectedImage === url
                            ? "border-primary ring-2 ring-primary"
                            : "border-transparent"
                        }`}
                      >
                        <img
                          src={url}
                          alt={`Image ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg";
                          }}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteImage(url, e)}
                        className="absolute top-1 right-1 p-1 rounded bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
                        title="Delete image"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-muted-foreground text-sm">
                    {searchQuery ? "No images match your search" : "No images uploaded yet"}
                  </p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Upload images to build your library
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSelect} disabled={!selectedImage}>
                Insert Image
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="flex-1 flex flex-col mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="upload-files">Select Image</Label>
              <div className="flex gap-2">
                <Input
                  id="upload-files"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  disabled={uploading}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Max file size: 5MB. Supported formats: JPG, PNG, GIF, WebP
              </p>
            </div>

            {uploading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="url" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image-url">Image URL</Label>
              <Input
                id="image-url"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Paste a direct link to an image
              </p>
            </div>

            {urlInput && (
              <div className="border rounded-lg p-2">
                <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                <img
                  src={urlInput}
                  alt="Preview"
                  className="max-h-32 mx-auto rounded"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg";
                  }}
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleUrlSubmit} disabled={!urlInput.trim()}>
                Insert Image
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
