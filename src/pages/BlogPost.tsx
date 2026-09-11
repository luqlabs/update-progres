import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Calendar, Eye, Clock, ThumbsUp, ThumbsDown } from "lucide-react";
import { Helmet } from "react-helmet";
import { Comments } from "@/components/blog/Comments";
import { ShareButtons } from "@/components/blog/ShareButtons";
import { ReadingProgress } from "@/components/blog/ReadingProgress";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { RelatedPosts } from "@/components/blog/RelatedPosts";
import { useToast } from "@/hooks/use-toast";
import { useCrisp } from "@/hooks/useCrisp";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  published_at: string;
  view_count: number;
  reading_time: number | null;
  featured_image: string | null;
  author_name: string | null;
  author_bio: string | null;
  author_avatar: string | null;
  category_id: string | null;
  meta_title: string | null;
  meta_description: string | null;
  blog_categories: { name: string } | null;
}

export default function BlogPost() {
  useCrisp();
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [isHelpPost, setIsHelpPost] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*, blog_categories(name)")
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (error) throw error;

      setPost(data);

      // Check if this is a help/tutorial post
      const { data: postTags } = await supabase
        .from("blog_post_tags")
        .select("blog_tags(slug)")
        .eq("post_id", data.id);
      const slugs = (postTags || []).map((pt: any) => pt.blog_tags?.slug).filter(Boolean);
      setIsHelpPost(slugs.includes("help") || slugs.includes("tutorial"));
      await supabase
        .from("blog_posts")
        .update({ view_count: data.view_count + 1 })
        .eq("id", data.id);
    } catch (error) {
      console.error("Error fetching post:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = (isHelpful: boolean) => {
    setHelpful(isHelpful);
    toast({
      title: "Thanks for your feedback!",
      description: "Your response helps us improve our content.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Post not found</h1>
          <Link to="/blog">
            <Button>Back to Blog</Button>
          </Link>
        </div>
      </div>
    );
  }

  const authorInitials = post.author_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "AU";

  return (
    <>
      <Helmet>
        <title>{post.meta_title || post.title}</title>
        {post.meta_description && (
          <meta name="description" content={post.meta_description} />
        )}
        <meta property="og:title" content={post.meta_title || post.title} />
        {post.meta_description && (
          <meta property="og:description" content={post.meta_description} />
        )}
        <meta property="og:type" content="article" />
        {post.featured_image && (
          <meta property="og:image" content={post.featured_image} />
        )}
      </Helmet>

      <ReadingProgress />

      <div className="min-h-screen bg-background">
        {/* Hero Header */}
        {post.featured_image ? (
          <div className="relative h-[500px] md:h-[600px]">
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            
            <div className="absolute inset-0 flex items-end">
              <div className="container mx-auto px-4 pb-12 md:pb-16">
                <div className="max-w-4xl space-y-4">
                  <Link to={isHelpPost ? "/help" : "/blog"}>
                    <Button variant="secondary" size="sm">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      {isHelpPost ? "Back to Help Center" : "Back to Blog"}
                    </Button>
                  </Link>
                  
                  {post.blog_categories && (
                    <Badge variant="secondary">{post.blog_categories.name}</Badge>
                  )}
                  
                  <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight">
                    {post.title}
                  </h1>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <header className="border-b bg-card">
            <div className="container mx-auto px-4 py-6">
              <Link to={isHelpPost ? "/help" : "/blog"}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {isHelpPost ? "Back to Help Center" : "Back to Blog"}
                </Button>
              </Link>
            </div>
          </header>
        )}

        {/* Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">
            {/* Main Article */}
            <article className="flex-1 max-w-4xl">
              {/* Meta Info */}
              {!post.featured_image && (
                <header className="space-y-4 mb-8">
                  {post.blog_categories && (
                    <Badge variant="secondary">{post.blog_categories.name}</Badge>
                  )}
                  <h1 className="text-4xl md:text-5xl font-bold">{post.title}</h1>
                </header>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8 pb-8 border-b">
                {post.author_name && (
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={post.author_avatar || undefined} />
                      <AvatarFallback>{authorInitials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-foreground">
                        {post.author_name}
                      </div>
                      {post.author_bio && (
                        <div className="text-xs">{post.author_bio}</div>
                      )}
                    </div>
                  </div>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(post.published_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {post.view_count} views
                </span>
                {post.reading_time && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {post.reading_time} min read
                  </span>
                )}
              </div>

              {/* Share Buttons */}
              <div className="mb-8">
                <ShareButtons url={post.title} title={post.title} />
              </div>

              {/* Content */}
              <div
                className="prose prose-lg dark:prose-invert max-w-none font-serif"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Feedback */}
              <div className="mt-12 pt-8 border-t">
                <h3 className="font-semibold mb-4">Was this article helpful?</h3>
                <div className="flex gap-4">
                  <Button
                    variant={helpful === true ? "default" : "outline"}
                    onClick={() => handleFeedback(true)}
                  >
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    Yes
                  </Button>
                  <Button
                    variant={helpful === false ? "default" : "outline"}
                    onClick={() => handleFeedback(false)}
                  >
                    <ThumbsDown className="h-4 w-4 mr-2" />
                    No
                  </Button>
                </div>
              </div>

              {/* Related Posts */}
              <RelatedPosts
                currentPostId={post.id}
                categoryId={post.category_id}
                isHelpPost={isHelpPost}
              />

              {/* Comments */}
              {!isHelpPost && (
                <div className="mt-12 pt-8 border-t">
                  <Comments postId={post.id} />
                </div>
              )}
            </article>

            {/* Sidebar */}
            <aside className="lg:w-80 space-y-6">
              <TableOfContents />
              
              <div className="sticky top-24 space-y-6">
                <div className="bg-card rounded-lg p-6 border">
                  <h4 className="font-semibold mb-4">Share this article</h4>
                  <ShareButtons url={post.title} title={post.title} />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
