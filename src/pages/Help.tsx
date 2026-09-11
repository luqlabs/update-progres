import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ArrowLeft, BookOpen, HelpCircle } from "lucide-react";
import { Helmet } from "react-helmet";
import { BlogCard } from "@/components/blog/BlogCard";
import { Skeleton } from "@/components/ui/skeleton";
import { getCanonicalUrl } from "@/lib/seo";

interface HelpPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  published_at: string;
  view_count: number;
  reading_time: number | null;
  blog_categories: { name: string } | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function Help() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<HelpPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchHelpPosts();
  }, []);

  const fetchHelpPosts = async () => {
    // Get tag IDs for "help" and "tutorial"
    const { data: tags } = await supabase
      .from("blog_tags")
      .select("id")
      .in("slug", ["help", "tutorial"]);

    if (!tags || tags.length === 0) {
      setLoading(false);
      return;
    }

    const tagIds = tags.map((t) => t.id);

    // Get post IDs that have these tags
    const { data: postTags } = await supabase
      .from("blog_post_tags")
      .select("post_id")
      .in("tag_id", tagIds);

    if (!postTags || postTags.length === 0) {
      setLoading(false);
      return;
    }

    const postIds = [...new Set(postTags.map((pt) => pt.post_id))];

    // Fetch the actual posts
    const { data } = await supabase
      .from("blog_posts")
      .select("*, blog_categories(name)")
      .eq("status", "published")
      .in("id", postIds)
      .order("published_at", { ascending: false });

    if (data) {
      setPosts(data);

      // Extract unique categories
      const uniqueCategories = new Map<string, Category>();
      data.forEach((post: any) => {
        if (post.blog_categories && post.category_id) {
          uniqueCategories.set(post.category_id, {
            id: post.category_id,
            name: post.blog_categories.name,
            slug: post.blog_categories.name.toLowerCase().replace(/\s+/g, "-"),
          });
        }
      });
      setCategories(Array.from(uniqueCategories.values()));
    }

    setLoading(false);
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      !searchQuery ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      !selectedCategory ||
      (post.blog_categories && post.blog_categories.name === selectedCategory);

    return matchesSearch && matchesCategory;
  });

  const canonicalUrl = getCanonicalUrl("help");

  return (
    <>
      <Helmet>
        <title>Help Center - Quizabl | Guides & Tutorials</title>
        <meta
          name="description"
          content="Learn how to get the most out of Quizabl. Guides, tutorials, and tips for creating engaging educational activities."
        />
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>

              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search help articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 md:py-12">
          {/* Hero */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <h1 className="font-display italic text-4xl md:text-5xl mb-3">Help Center</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Guides, tutorials, and tips to help you create amazing educational
              activities with Quizabl.
            </p>
          </div>

          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              <Button
                variant={!selectedCategory ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                All
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.name ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.name)}
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-[16/9] rounded-lg" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-16">
              <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Coming Soon</h2>
              <p className="text-muted-foreground">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "We're working on helpful guides and tutorials. Stay tuned!"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
              {filteredPosts.map((post) => (
                <BlogCard
                  key={post.id}
                  {...post}
                  excerpt={post.excerpt || ""}
                  category={post.blog_categories}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
