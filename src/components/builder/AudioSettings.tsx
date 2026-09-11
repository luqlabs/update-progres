import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Music, Volume2, X, ExternalLink, Upload, Trash2, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
import { Skeleton } from "@/components/ui/skeleton";

interface AudioSettingsProps {
  audioUrl?: string;
  volume?: number;
  onUpdate: (audioUrl: string | undefined, volume: number) => void;
}

const AudioSettings = ({ audioUrl, volume = 50, onUpdate }: AudioSettingsProps) => {
  const [url, setUrl] = useState(audioUrl || "");
  const [localVolume, setLocalVolume] = useState(volume);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("url");
  const [hasLoadedFiles, setHasLoadedFiles] = useState(false);

  const isYouTubeUrl = (urlString: string) => {
    return urlString.includes("youtube.com") || urlString.includes("youtu.be");
  };

  const getYouTubeEmbedUrl = (urlString: string) => {
    const videoIdMatch = urlString.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (videoIdMatch) {
      return `https://www.youtube.com/embed/${videoIdMatch[1]}?autoplay=1&loop=1&playlist=${videoIdMatch[1]}`;
    }
    return null;
  };

  const handleSave = () => {
    if (!url.trim()) {
      onUpdate(undefined, localVolume);
      return;
    }
    onUpdate(url.trim(), localVolume);
  };

  const handleRemove = () => {
    setUrl("");
    onUpdate(undefined, localVolume);
  };

  useEffect(() => {
    if (!hasLoadedFiles) {
      fetchUploadedFiles();
      setHasLoadedFiles(true);
    }
  }, []);

  const fetchUploadedFiles = async () => {
    setLoadingFiles(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.storage
        .from('background-audio')
        .list(user.id, {
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) throw error;
      setUploadedFiles(data || []);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error("Failed to load uploaded files");
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|m4a|aac)$/i)) {
      toast.error("Please upload a valid audio file (MP3, WAV, OGG, M4A, AAC)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to upload files");
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('background-audio')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('background-audio')
        .getPublicUrl(fileName);

      setUrl(publicUrl);
      onUpdate(publicUrl, localVolume);
      toast.success("Audio file uploaded successfully!");
      await fetchUploadedFiles();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error("Failed to upload audio file");
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleDeleteFile = async (filePath: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.storage
        .from('background-audio')
        .remove([`${user.id}/${filePath}`]);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('background-audio')
        .getPublicUrl(`${user.id}/${filePath}`);

      if (url === publicUrl) {
        setUrl("");
        onUpdate(undefined, localVolume);
      }

      toast.success("File deleted successfully!");
      await fetchUploadedFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error("Failed to delete file");
    } finally {
      setFileToDelete(null);
    }
  };

  const handleUseFile = async (fileName: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: { publicUrl } } = supabase.storage
      .from('background-audio')
      .getPublicUrl(`${user.id}/${fileName}`);
    
    setUrl(publicUrl);
    onUpdate(publicUrl, localVolume);
    toast.success("Audio file selected!");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Music className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Background Audio</h3>
      </div>

      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url">URL</TabsTrigger>
            <TabsTrigger value="upload">Upload File</TabsTrigger>
          </TabsList>
          
          <TabsContent value="url" className="space-y-2 mt-4">
            <Label htmlFor="audio-url">Audio URL</Label>
            <div className="flex gap-2">
              <Input
                id="audio-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=... or direct audio URL"
                className="flex-1"
              />
              {url && (
                <Button variant="ghost" size="icon" onClick={handleRemove}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Paste a YouTube URL or direct link to an audio file (MP3, WAV, etc.)
            </p>
            
            {url && isYouTubeUrl(url) && (
              <div className="p-3 bg-muted rounded-lg text-sm mt-2">
                <p className="flex items-center gap-2 text-muted-foreground">
                  <ExternalLink className="w-4 h-4" />
                  YouTube video will play as background audio
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="upload" className="space-y-4 mt-4">
            <div>
              <Label htmlFor="audio-file">Upload New Audio File</Label>
              <div className="mt-2 flex items-center gap-2">
                <label htmlFor="audio-file" className="flex-1">
                  <div className="border-2 border-dashed rounded-lg p-4 hover:border-primary transition-colors cursor-pointer">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Upload className="w-5 h-5" />
                      <span className="text-sm">
                        {uploading ? "Uploading..." : "Click to upload audio file"}
                      </span>
                    </div>
                  </div>
                  <Input
                    id="audio-file"
                    type="file"
                    accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/m4a,audio/aac,.mp3,.wav,.ogg,.m4a,.aac"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Upload an audio file (MP3, WAV, OGG, M4A, AAC) - Max 10MB
              </p>
            </div>

            <div>
              <Label>Your Uploaded Files</Label>
              <div className="mt-2 space-y-2 max-h-[400px] overflow-y-auto">
                {loadingFiles ? (
                  <>
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </>
                ) : uploadedFiles.length === 0 ? (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Music className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No uploaded files yet. Upload your first audio file above.
                    </p>
                  </div>
                ) : (
                  uploadedFiles.map((file) => {
                    const getFileUrl = async () => {
                      const { data: { user } } = await supabase.auth.getUser();
                      if (!user) return '';
                      const { data: { publicUrl } } = supabase.storage
                        .from('background-audio')
                        .getPublicUrl(`${user.id}/${file.name}`);
                      return publicUrl;
                    };
                    
                    // For display purposes, we'll check if the filename matches
                    const isCurrentFile = url.includes(file.name);

                    return (
                      <div
                        key={file.id}
                        className={`border rounded-lg p-4 space-y-3 ${
                          isCurrentFile ? 'border-primary bg-primary/5' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Music className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              <p className="font-medium text-sm truncate">{file.name}</p>
                              {isCurrentFile && (
                                <span className="flex items-center gap-1 text-xs text-primary">
                                  <Check className="w-3 h-3" />
                                  Current
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span>{formatFileSize(file.metadata?.size || 0)}</span>
                              <span>•</span>
                              <span>{formatDate(file.created_at)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUseFile(file.name)}
                              disabled={isCurrentFile}
                            >
                              Use
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setFileToDelete(file.name)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <audio
                          controls
                          src={url.includes(file.name) ? url : `${supabase.storage.from('background-audio').getPublicUrl(`${file.name}`).data.publicUrl}`}
                          className="w-full h-8"
                          preload="metadata"
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-2">
          <Label htmlFor="volume">Default Volume: {localVolume}%</Label>
          <div className="flex items-center gap-3">
            <Volume2 className="w-4 h-4 text-muted-foreground" />
            <Slider
              id="volume"
              value={[localVolume]}
              onValueChange={(value) => setLocalVolume(value[0])}
              max={100}
              step={5}
              className="flex-1"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Students can adjust volume during the quiz
          </p>
        </div>

        <Button onClick={handleSave} className="w-full">
          Save Audio Settings
        </Button>
      </div>

      <AlertDialog open={!!fileToDelete} onOpenChange={() => setFileToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Audio File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{fileToDelete}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => fileToDelete && handleDeleteFile(fileToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default AudioSettings;
