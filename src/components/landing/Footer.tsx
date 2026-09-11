import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export const Footer = () => {
  const navigate = useNavigate();

  const footerLinks = {
    product: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "FAQ", href: "#faq" },
    ],
    resources: [
      { label: "Blog", onClick: () => navigate("/blog") },
      { label: "Roadmap", href: "https://quizabl.featurebase.app/roadmap" },
      { label: "Help Center", href: "mailto:support@quizabl.com" },
    ],
    company: [
      { label: "Contact", href: "mailto:hello@quizabl.com" },
    ],
    legal: [
      { label: "Privacy Policy", onClick: () => navigate("/privacy-policy") },
      { label: "Terms of Service", onClick: () => navigate("/terms-of-service") },
    ],
  };

  return (
    <footer className="bg-card border-t border-border mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
          {/* Quizabl Column */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4">
              <Logo size="md" />
            </div>
            <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
              pre-lecture and formative quizzes for university lecturers — built by chatting, shared with one link.
            </p>
          </div>

          {/* Product Column */}
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  {link.onClick ? (
                    <Button
                      variant="link"
                      onClick={link.onClick}
                      className="h-auto p-0 text-muted-foreground hover:text-primary"
                    >
                      {link.label}
                    </Button>
                  ) : (
                    <a
                      href={link.href}
                      className="text-muted-foreground hover:text-primary transition-colors text-sm"
                      {...(link.href?.startsWith('http') && {
                        target: "_blank",
                        rel: "noopener noreferrer"
                      })}
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Button
                    variant="link"
                    onClick={link.onClick}
                    className="h-auto p-0 text-muted-foreground hover:text-primary"
                  >
                    {link.label}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Quizabl. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground">
              Built for university lecturers who teach to the gap.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
