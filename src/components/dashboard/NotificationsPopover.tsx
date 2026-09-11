import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Bell, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  published_at: string;
}

interface NotificationsPopoverProps {
  userId: string;
}

export function NotificationsPopover({ userId }: NotificationsPopoverProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [lastReadAt, setLastReadAt] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [userId]);

  const fetchNotifications = async () => {
    try {
      // Fetch last read timestamp from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("last_notification_read_at")
        .eq("id", userId)
        .single();

      setLastReadAt(profile?.last_notification_read_at || null);

      // Fetch published blog posts
      const { data: blogPosts, error } = await supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, featured_image, published_at")
        .eq("status", "published")
        .lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setPosts(blogPosts || []);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    if (!userId) return;
    
    const { error } = await supabase
      .from("profiles")
      .update({ last_notification_read_at: new Date().toISOString() })
      .eq("id", userId);

    if (!error) {
      setLastReadAt(new Date().toISOString());
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      markAsRead();
    }
  };

  const isUnread = (publishedAt: string) => {
    if (!lastReadAt) return true;
    return new Date(publishedAt) > new Date(lastReadAt);
  };

  const unreadCount = posts.filter((post) => isUnread(post.published_at)).length;

  const handlePostClick = (slug: string) => {
    setOpen(false);
    window.open(`/blog/${slug}`, '_blank');
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-primary" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="top"
        className="w-80 p-0"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h4 className="font-semibold text-sm">Notifications</h4>
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs text-primary"
            onClick={() => {
              setOpen(false);
              window.open("/blog", '_blank');
            }}
          >
            See all updates
            <ExternalLink className="ml-1 h-3 w-3" />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="max-h-80">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : posts.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No updates yet
            </div>
          ) : (
            <div className="divide-y">
              {posts.map((post) => (
                <button
                  key={post.id}
                  onClick={() => handlePostClick(post.slug)}
                  className="w-full flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
                >
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-md overflow-hidden bg-muted shrink-0">
                    {post.featured_image ? (
                      <img
                        src={post.featured_image}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-secondary" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      {isUnread(post.published_at) && (
                        <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm line-clamp-1">
                          {post.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(post.published_at), "d MMMM yyyy")}
                        </p>
                        {post.excerpt && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {post.excerpt}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
