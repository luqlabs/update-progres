import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Eye, Clock, ArrowRight } from "lucide-react";

interface BlogHeroProps {
  slug: string;
  title: string;
  excerpt: string;
  featured_image: string | null;
  published_at: string;
  view_count: number;
  reading_time: number | null;
  category: { name: string } | null;
}

export function BlogHero({
  slug,
  title,
  excerpt,
  featured_image,
  published_at,
  view_count,
  reading_time,
  category,
}: BlogHeroProps) {
  return (
    <div className="relative h-[500px] md:h-[600px] overflow-hidden rounded-md mb-12">
      {featured_image && (
        <div className="absolute inset-0">
          <img
            src={featured_image}
            alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
      )}
      
      <div className="relative h-full flex items-end">
        <div className="container mx-auto px-4 pb-12 md:pb-16">
          <div className="max-w-3xl space-y-4">
            {category && (
              <Badge variant="secondary" className="mb-2">
                {category.name}
              </Badge>
            )}
            
            <h1 className="font-display italic text-4xl md:text-5xl lg:text-6xl leading-[1.1] text-foreground">
              {title}
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground line-clamp-2">
              {excerpt}
            </p>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(published_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {view_count} views
              </span>
              {reading_time && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {reading_time} min read
                </span>
              )}
            </div>
            
            <Link to={`/blog/${slug}`}>
              <Button size="lg" className="mt-4">
                Read Full Article
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
