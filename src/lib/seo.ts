const BASE_URL = "https://www.quizabl.com";

export const getCanonicalUrl = (path: string): string => {
  // Remove leading slash if present and ensure clean path
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${BASE_URL}/${cleanPath}`;
};

export const getOgImageUrl = (imagePath?: string): string => {
  if (!imagePath) return `${BASE_URL}/og-default.jpg`;
  return imagePath.startsWith('http') ? imagePath : `${BASE_URL}${imagePath}`;
};

export const createOrganizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Quizabl",
  "url": BASE_URL,
  "logo": `${BASE_URL}/logo.png`,
  "description": "AI-powered platform for creating engaging quizzes, flashcards, and interactive learning games",
  "sameAs": [
    "https://twitter.com/quizabl",
    "https://facebook.com/quizabl"
  ]
});

export const createWebsiteSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Quizabl",
  "url": BASE_URL,
  "potentialAction": {
    "@type": "SearchAction",
    "target": `${BASE_URL}/blog?search={search_term_string}`,
    "query-input": "required name=search_term_string"
  }
});

export const createBreadcrumbSchema = (items: Array<{ name: string; url: string }>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url
  }))
});

export const createBlogPostSchema = (post: {
  title: string;
  description: string;
  author: string;
  publishedDate: string;
  modifiedDate: string;
  imageUrl?: string;
  url: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": post.title,
  "description": post.description,
  "author": {
    "@type": "Person",
    "name": post.author
  },
  "datePublished": post.publishedDate,
  "dateModified": post.modifiedDate,
  "image": post.imageUrl || `${BASE_URL}/og-default.jpg`,
  "url": post.url,
  "publisher": {
    "@type": "Organization",
    "name": "Quizabl",
    "logo": {
      "@type": "ImageObject",
      "url": `${BASE_URL}/logo.png`
    }
  }
});
