import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Comment {
  id: string;
  content: string;
  author_name: string;
  author_email: string | null;
  status: string;
  created_at: string;
  blog_posts: { title: string } | null;
}

export default function BlogComments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchComments();
  }, [statusFilter]);

  const fetchComments = async () => {
    try {
      let query = supabase
        .from("blog_comments")
        .select("*, blog_posts(title)")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setComments(data || []);
    } catch (error: any) {
      console.error("Error fetching comments:", error);
      toast.error("Failed to fetch comments");
    } finally {
      setLoading(false);
    }
  };

  const updateCommentStatus = async (
    id: string,
    status: "approved" | "spam"
  ) => {
    try {
      const { error } = await supabase
        .from("blog_comments")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      setComments(
        comments.map((c) => (c.id === id ? { ...c, status } : c))
      );
      toast.success(
        status === "approved" ? "Comment approved" : "Marked as spam"
      );
    } catch (error: any) {
      console.error("Error updating comment:", error);
      toast.error("Failed to update comment");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this comment? This cannot be undone.")) return;

    try {
      const { error } = await supabase
        .from("blog_comments")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setComments(comments.filter((c) => c.id !== id));
      toast.success("Comment deleted");
    } catch (error: any) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Blog Comments</h1>
            <p className="text-muted-foreground">Moderate user comments</p>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Comments</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="spam">Spam</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-card rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Post</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : comments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No comments found
                  </TableCell>
                </TableRow>
              ) : (
                comments.map((comment) => (
                  <TableRow key={comment.id}>
                    <TableCell className="font-medium">
                      {comment.blog_posts?.title || "Unknown"}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{comment.author_name}</div>
                        {comment.author_email && (
                          <div className="text-xs text-muted-foreground">
                            {comment.author_email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {comment.content}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          comment.status === "approved"
                            ? "default"
                            : comment.status === "spam"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {comment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(comment.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {comment.status !== "approved" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              updateCommentStatus(comment.id, "approved")
                            }
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        {comment.status !== "spam" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              updateCommentStatus(comment.id, "spam")
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(comment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}
