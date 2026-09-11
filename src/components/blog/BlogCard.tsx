import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Calendar, Eye, Clock } from "lucide-react";

interface BlogCardProps {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  featured_image: string | null;
  published_at: string;
  view_count: number;
  reading_time: number | null;
  category: { name: string } | null;
}

export function BlogCard({
  slug,
  title,
  excerpt,
  featured_image,
  published_at,
  view_count,
  reading_time,
  category,
}: BlogCardProps) {
  return (
    <Link to={`/blog/${slug}`}>
      <article className="group h-full bg-card rounded-lg overflow-hidden border hover:border-foreground/30 transition-all duration-300 hover:-translate-y-1">
        {featured_image && (
          <div className="aspect-[16/9] overflow-hidden">
            <img
              src={featured_image}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        
        <div className="p-6 space-y-3">
          {category && (
            <Badge variant="secondary" className="mb-2">
              {category.name}
            </Badge>
          )}
          
          <h3 className="text-xl font-bold line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          
          <p className="text-muted-foreground line-clamp-3 text-sm">
            {excerpt}
          </p>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(published_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {view_count}
            </span>
            {reading_time && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {reading_time} min read
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
