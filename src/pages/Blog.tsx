import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ArrowLeft } from "lucide-react";
import { Helmet } from "react-helmet";
import { BlogCard } from "@/components/blog/BlogCard";
import { BlogHero } from "@/components/blog/BlogHero";
import { NewsletterSignup } from "@/components/blog/NewsletterSignup";
import { Skeleton } from "@/components/ui/skeleton";
import { useCrisp } from "@/hooks/useCrisp";
import { getCanonicalUrl, createBreadcrumbSchema } from "@/lib/seo";

interface BlogPost {
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

export default function Blog() {
  useCrisp();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const categorySlug = searchParams.get("category");

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchCategories();
    fetchPosts();
  }, [categorySlug]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("blog_categories")
      .select("*")
      .order("name");

    if (data) setCategories(data);
  };

  const fetchPosts = async () => {
    // Get help/tutorial tag IDs to exclude from blog
    const { data: helpTags } = await supabase
      .from("blog_tags")
      .select("id")
      .in("slug", ["help", "tutorial"]);

    const helpTagIds = helpTags?.map((t) => t.id) || [];

    let excludePostIds: string[] = [];
    if (helpTagIds.length > 0) {
      const { data: helpPostTags } = await supabase
        .from("blog_post_tags")
        .select("post_id")
        .in("tag_id", helpTagIds);
      excludePostIds = [...new Set(helpPostTags?.map((pt) => pt.post_id) || [])];
    }

    let query = supabase
      .from("blog_posts")
      .select("*, blog_categories(name)")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (categorySlug) {
      const { data: category } = await supabase
        .from("blog_categories")
        .select("id")
        .eq("slug", categorySlug)
        .single();

      if (category) {
        query = query.eq("category_id", category.id);
      }
    }

    const { data } = await query;

    if (data) {
      // Exclude help/tutorial posts from the blog listing
      const filtered = excludePostIds.length > 0
        ? data.filter((post) => !excludePostIds.includes(post.id))
        : data;
      setPosts(filtered);
    }
    setLoading(false);
  };

  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const featuredPost = filteredPosts[0];
  const remainingPosts = filteredPosts.slice(1);

  const canonicalUrl = getCanonicalUrl('blog');
  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", url: getCanonicalUrl('') },
    { name: "Blog", url: canonicalUrl }
  ]);

  return (
    <>
      <Helmet>
        <title>Blog - Quizabl | Education Tips and AI Learning Tools</title>
        <meta
          name="description"
          content="Read the latest articles about education, teaching tips, and AI-powered learning tools. Expert insights for modern educators."
        />
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content="Quizabl Blog - Education Tips and AI Learning" />
        <meta property="og:description" content="Read the latest articles about education, teaching tips, and AI-powered learning tools." />
        <meta property="og:site_name" content="Quizabl" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={canonicalUrl} />
        <meta name="twitter:title" content="Quizabl Blog - Education Tips" />
        <meta name="twitter:description" content="Expert insights for modern educators using AI-powered learning tools." />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>

              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search articles..."
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
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <aside className="lg:w-64 space-y-6">
              <div className="bg-card rounded-lg p-6 border sticky top-24">
                <h3 className="font-bold mb-4">Categories</h3>
                <div className="space-y-2">
                  <Button
                    variant={!categorySlug ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => navigate("/blog")}
                  >
                    All Posts
                  </Button>
                  {categories.map((category) => (
                    <Button
                      key={category.id}
                      variant={
                        categorySlug === category.slug ? "secondary" : "ghost"
                      }
                      className="w-full justify-start"
                      onClick={() =>
                        navigate(`/blog?category=${category.slug}`)
                      }
                    >
                      {category.name}
                    </Button>
                  ))}
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 space-y-12">
              {loading ? (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <Skeleton className="h-[500px] rounded-md" />
                  </div>
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
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold mb-2">No posts found</h2>
                  <p className="text-muted-foreground">
                    Try adjusting your search or category filter
                  </p>
                </div>
              ) : (
                <>
                  {/* Featured Post Hero */}
                  {featuredPost && !searchQuery && (
                    <BlogHero
                      slug={featuredPost.slug}
                      title={featuredPost.title}
                      excerpt={featuredPost.excerpt || ""}
                      featured_image={featuredPost.featured_image}
                      published_at={featuredPost.published_at}
                      view_count={featuredPost.view_count}
                      reading_time={featuredPost.reading_time}
                      category={featuredPost.blog_categories}
                    />
                  )}

                  {/* Posts Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                    {(searchQuery ? filteredPosts : remainingPosts).map((post) => (
                      <BlogCard
                        key={post.id}
                        {...post}
                        category={post.blog_categories}
                      />
                    ))}
                  </div>

                  {/* Newsletter Signup */}
                  {!searchQuery && remainingPosts.length > 3 && (
                    <NewsletterSignup />
                  )}
                </>
              )}
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
