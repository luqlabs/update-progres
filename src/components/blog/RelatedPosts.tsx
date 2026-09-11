import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BlogCard } from "./BlogCard";

interface RelatedPostsProps {
  currentPostId: string;
  categoryId: string | null;
  isHelpPost?: boolean;
}

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

export function RelatedPosts({ currentPostId, categoryId, isHelpPost = false }: RelatedPostsProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRelatedPosts();
  }, [currentPostId, categoryId, isHelpPost]);

  const fetchRelatedPosts = async () => {
    try {
      // Get help/tutorial tag IDs
      const { data: helpTags } = await supabase
        .from("blog_tags")
        .select("id")
        .in("slug", ["help", "tutorial"]);
      const helpTagIds = (helpTags || []).map((t) => t.id);

      if (isHelpPost) {
        // Show only other help/tutorial posts
        if (helpTagIds.length === 0) {
          setPosts([]);
          return;
        }
        const { data: postTagRows } = await supabase
          .from("blog_post_tags")
          .select("post_id")
          .in("tag_id", helpTagIds);
        const helpPostIds = [...new Set((postTagRows || []).map((r) => r.post_id))].filter(
          (pid) => pid !== currentPostId
        );
        if (helpPostIds.length === 0) {
          setPosts([]);
          return;
        }
        const { data, error } = await supabase
          .from("blog_posts")
          .select("*, blog_categories(name)")
          .eq("status", "published")
          .in("id", helpPostIds)
          .order("published_at", { ascending: false })
          .limit(3);
        if (error) throw error;
        setPosts(data || []);
      } else {
        // Exclude help/tutorial posts
        let excludePostIds: string[] = [];
        if (helpTagIds.length > 0) {
          const { data: postTagRows } = await supabase
            .from("blog_post_tags")
            .select("post_id")
            .in("tag_id", helpTagIds);
          excludePostIds = [...new Set((postTagRows || []).map((r) => r.post_id))];
        }

        let query = supabase
          .from("blog_posts")
          .select("*, blog_categories(name)")
          .eq("status", "published")
          .neq("id", currentPostId)
          .order("published_at", { ascending: false })
          .limit(3);

        if (categoryId) {
          query = query.eq("category_id", categoryId);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Filter out help posts client-side
        const filtered = (data || []).filter((p) => !excludePostIds.includes(p.id));
        setPosts(filtered.slice(0, 3));
      }
    } catch (error) {
      console.error("Error fetching related posts:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || posts.length === 0) return null;

  return (
    <section className="py-12 border-t">
      <h2 className="text-2xl font-bold mb-8">Related Articles</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {posts.map((post) => (
          <BlogCard 
            key={post.id} 
            {...post}
            category={post.blog_categories}
          />
        ))}
      </div>
    </section>
  );
}
