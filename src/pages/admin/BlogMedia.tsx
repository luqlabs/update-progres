import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Trash2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Media {
  id: string;
  filename: string;
  file_path: string;
  file_size: number | null;
  alt_text: string | null;
  created_at: string;
}

export default function BlogMedia() {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      const { data, error } = await supabase
        .from("blog_media")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMedia(data || []);
    } catch (error: any) {
      console.error("Error fetching media:", error);
      toast.error("Failed to fetch media");
    } finally {
      setLoading(false);
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

      for (const file of Array.from(files)) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from("blog-media")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("blog-media").getPublicUrl(filePath);

        // Save to database
        const { error: dbError } = await supabase.from("blog_media").insert([
          {
            filename: file.name,
            file_path: publicUrl,
            file_size: file.size,
            mime_type: file.type,
            uploaded_by: user.id,
          },
        ]);

        if (dbError) throw dbError;
      }

      toast.success("Files uploaded successfully");
      setDialogOpen(false);
      fetchMedia();
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

  const copyToClipboard = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      toast.success("URL copied to clipboard");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error("Failed to copy URL");
    }
  };

  const handleDelete = async (id: string, filePath: string) => {
    if (!confirm("Delete this media file? This cannot be undone.")) return;

    try {
      // Extract path from URL for storage deletion
      const url = new URL(filePath);
      const path = url.pathname.split("/storage/v1/object/public/blog-media/")[1];

      if (path) {
        await supabase.storage.from("blog-media").remove([path]);
      }

      const { error } = await supabase.from("blog_media").delete().eq("id", id);

      if (error) throw error;

      setMedia(media.filter((m) => m.id !== id));
      toast.success("Media deleted");
    } catch (error: any) {
      console.error("Error deleting media:", error);
      toast.error("Failed to delete media");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Media Library</h1>
            <p className="text-muted-foreground">
              Manage images and files for your blog
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload Files
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Media</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="files">Select Files</Label>
                  <Input
                    id="files"
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    multiple
                    disabled={uploading}
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Supported formats: JPG, PNG, GIF, WebP
                  </p>
                </div>
                {uploading && (
                  <p className="text-sm text-muted-foreground">
                    Uploading...
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {loading ? (
            <div className="col-span-full text-center py-12">Loading...</div>
          ) : media.length === 0 ? (
            <div className="col-span-full text-center py-12">
              No media files found
            </div>
          ) : (
            media.map((item) => (
              <div
                key={item.id}
                className="group relative bg-card border rounded-lg overflow-hidden"
              >
                <div className="aspect-square bg-muted flex items-center justify-center">
                  <img
                    src={item.file_path}
                    alt={item.alt_text || item.filename}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg";
                    }}
                  />
                </div>
                <div className="p-3 space-y-2">
                  <p className="text-sm font-medium truncate">
                    {item.filename}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.file_size
                      ? `${(item.file_size / 1024).toFixed(1)} KB`
                      : "Unknown size"}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => copyToClipboard(item.file_path, item.id)}
                    >
                      {copiedId === item.id ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(item.id, item.file_path)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
