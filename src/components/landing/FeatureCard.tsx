import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
  delay?: string;
}

export const FeatureCard = ({ icon: Icon, title, description, gradient, delay = "0s" }: FeatureCardProps) => {
  return (
    <div 
      className="group p-8 bg-card rounded-md border-2 border-border hover:border-primary/50 shadow-none hover:border-foreground/30 transition-all animate-fade-in"
      style={{ animationDelay: delay }}
    >
      <div className={`w-16 h-16 ${gradient} rounded-md flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-none`}>
        <Icon className="w-8 h-8 text-primary-foreground" />
      </div>
      
      <h3 className="text-base font-semibold mb-2 group-hover:text-primary transition-colors">
        {title}
      </h3>
      
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
};
