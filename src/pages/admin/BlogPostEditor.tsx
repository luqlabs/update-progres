import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Save, Eye, Plus, Image as ImageIcon, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RichTextEditor } from "@/components/blog/RichTextEditor";
import { MediaLibraryDialog } from "@/components/admin/MediaLibraryDialog";
import { CategoryDialog } from "@/components/admin/CategoryDialog";
import { TagDialog } from "@/components/admin/TagDialog";
import { Badge } from "@/components/ui/badge";

interface Category {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
}

export default function BlogPostEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showMediaDialog, setShowMediaDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category_id: "",
    status: "draft",
    featured_image: "",
    author_name: "",
    author_bio: "",
    author_avatar: "",
    meta_title: "",
    meta_description: "",
    meta_keywords: "",
  });

  useEffect(() => {
    fetchCategories();
    fetchTags();
    if (isEditing) {
      fetchPost();
      fetchPostTags();
    }
  }, [id]);

  const fetchTags = async () => {
    const { data } = await supabase.from("blog_tags").select("*").order("name");
    let tagList = data || [];

    // Auto-create Help and Tutorial tags if missing
    const requiredTags = [
      { name: "Help", slug: "help" },
      { name: "Tutorial", slug: "tutorial" },
    ];
    const missingSlugs = requiredTags.filter(
      (rt) => !tagList.some((t) => t.slug === rt.slug)
    );
    if (missingSlugs.length > 0) {
      await supabase.from("blog_tags").insert(missingSlugs);
      const { data: refreshed } = await supabase.from("blog_tags").select("*").order("name");
      tagList = refreshed || [];
    }

    setTags(tagList);
  };

  const fetchPostTags = async () => {
    const { data } = await supabase
      .from("blog_post_tags")
      .select("tag_id")
      .eq("post_id", id!);
    setSelectedTagIds((data || []).map((t) => t.tag_id));
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("blog_categories")
      .select("*")
      .order("name");
    setCategories(data || []);
  };

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setFormData({
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt || "",
        content: data.content,
        category_id: data.category_id || "",
        status: data.status,
        featured_image: data.featured_image || "",
        author_name: data.author_name || "",
        author_bio: data.author_bio || "",
        author_avatar: data.author_avatar || "",
        meta_title: data.meta_title || "",
        meta_description: data.meta_description || "",
        meta_keywords: data.meta_keywords || "",
      });
    } catch (error: any) {
      console.error("Error fetching post:", error);
      toast.error("Failed to load post");
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: formData.slug || generateSlug(title),
      meta_title: formData.meta_title || title,
    });
  };

  const handleCategoryCreated = (categoryId: string) => {
    fetchCategories();
    setFormData({ ...formData, category_id: categoryId });
  };

  const handleFeaturedImageSelect = (imageUrl: string) => {
    setFormData({ ...formData, featured_image: imageUrl });
  };

  const handleSave = async (status: string) => {
    if (!formData.title || !formData.content) {
      toast.error("Title and content are required");
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const postData = {
        ...formData,
        category_id: formData.category_id || null,
        status,
        published_at: status === "published" ? new Date().toISOString() : null,
        author_id: user.id,
      };

      let postId = id;
      if (isEditing) {
        const { error } = await supabase
          .from("blog_posts")
          .update(postData)
          .eq("id", id);
        if (error) throw error;
        toast.success("Post updated");
      } else {
        const { data, error } = await supabase
          .from("blog_posts")
          .insert([postData])
          .select("id")
          .single();
        if (error) throw error;
        postId = data.id;
        toast.success("Post created");
      }

      // Sync tags
      await supabase.from("blog_post_tags").delete().eq("post_id", postId!);
      if (selectedTagIds.length > 0) {
        await supabase.from("blog_post_tags").insert(
          selectedTagIds.map((tag_id) => ({ post_id: postId!, tag_id }))
        );
      }

      navigate("/admin/blog/posts");
    } catch (error: any) {
      console.error("Error saving post:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin/blog/posts")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Posts
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleSave("draft")}
              disabled={loading}
            >
              Save Draft
            </Button>
            <Button
              onClick={() => handleSave("published")}
              disabled={loading}
            >
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? "Update" : "Publish"}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="seo">SEO Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Enter post title"
                className="text-2xl font-bold"
              />
            </div>

            <div>
              <Label htmlFor="slug">URL Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                placeholder="post-url-slug"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                    <Label htmlFor="category">Category</Label>
                    <div className="flex gap-2">
                      <Select
                        value={formData.category_id}
                        onValueChange={(value) =>
                          setFormData({ ...formData, category_id: value })
                        }
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setShowCategoryDialog(true)}
                        title="Create new category"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={selectedTagIds.includes(tag.id) ? "default" : "outline"}
                    className="cursor-pointer select-none"
                    onClick={() =>
                      setSelectedTagIds((prev) =>
                        prev.includes(tag.id)
                          ? prev.filter((t) => t !== tag.id)
                          : [...prev, tag.id]
                      )
                    }
                  >
                    {tag.name}
                  </Badge>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTagDialog(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  New Tag
                </Button>
              </div>
            </div>

            <div>
              <Label>Featured Image</Label>
              {formData.featured_image ? (
                <div className="space-y-2">
                  <div className="relative aspect-video w-full rounded-lg overflow-hidden border bg-muted">
                    <img
                      src={formData.featured_image}
                      alt="Featured"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg";
                      }}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() =>
                        setFormData({ ...formData, featured_image: "" })
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowMediaDialog(true)}
                    className="w-full"
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Change Image
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowMediaDialog(true)}
                  className="w-full"
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Select Featured Image
                </Button>
              )}
            </div>

            <div>
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) =>
                  setFormData({ ...formData, excerpt: e.target.value })
                }
                placeholder="Brief description (optional)"
                rows={3}
              />
            </div>

            {/* Author Information */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold">Author Information</h3>
              
              <div>
                <Label htmlFor="author_name">Author Name</Label>
                <Input
                  id="author_name"
                  value={formData.author_name}
                  onChange={(e) =>
                    setFormData({ ...formData, author_name: e.target.value })
                  }
                  placeholder="Author's full name (optional)"
                />
              </div>

              <div>
                <Label htmlFor="author_bio">Author Bio</Label>
                <Textarea
                  id="author_bio"
                  value={formData.author_bio}
                  onChange={(e) =>
                    setFormData({ ...formData, author_bio: e.target.value })
                  }
                  placeholder="Short author biography (optional)"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="author_avatar">Author Avatar URL</Label>
                <Input
                  id="author_avatar"
                  value={formData.author_avatar}
                  onChange={(e) =>
                    setFormData({ ...formData, author_avatar: e.target.value })
                  }
                  placeholder="https://example.com/avatar.jpg (optional)"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="content">Content *</Label>
              <RichTextEditor
                content={formData.content}
                onChange={(content) =>
                  setFormData({ ...formData, content })
                }
              />
            </div>
          </TabsContent>

          <TabsContent value="seo" className="space-y-4">
            <div>
              <Label htmlFor="meta_title">Meta Title</Label>
              <Input
                id="meta_title"
                value={formData.meta_title}
                onChange={(e) =>
                  setFormData({ ...formData, meta_title: e.target.value })
                }
                placeholder="SEO title (max 60 characters)"
                maxLength={60}
              />
              <p className="text-sm text-muted-foreground mt-1">
                {formData.meta_title.length}/60 characters
              </p>
            </div>

            <div>
              <Label htmlFor="meta_description">Meta Description</Label>
              <Textarea
                id="meta_description"
                value={formData.meta_description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    meta_description: e.target.value,
                  })
                }
                placeholder="SEO description (max 160 characters)"
                maxLength={160}
                rows={3}
              />
              <p className="text-sm text-muted-foreground mt-1">
                {formData.meta_description.length}/160 characters
              </p>
            </div>

            <div>
              <Label htmlFor="meta_keywords">Keywords</Label>
              <Input
                id="meta_keywords"
                value={formData.meta_keywords}
                onChange={(e) =>
                  setFormData({ ...formData, meta_keywords: e.target.value })
                }
                placeholder="keyword1, keyword2, keyword3"
              />
            </div>
          </TabsContent>
        </Tabs>

        <CategoryDialog
          open={showCategoryDialog}
          onClose={() => setShowCategoryDialog(false)}
          onSuccess={handleCategoryCreated}
        />

        <TagDialog
          open={showTagDialog}
          onClose={() => setShowTagDialog(false)}
          onSuccess={(tagId) => {
            fetchTags();
            setSelectedTagIds((prev) => [...prev, tagId]);
          }}
        />

        <MediaLibraryDialog
          open={showMediaDialog}
          onClose={() => setShowMediaDialog(false)}
          onSelect={handleFeaturedImageSelect}
        />
      </div>
    </AdminLayout>
  );
}
