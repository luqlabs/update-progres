import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  className?: string;
}

const sizeMap = {
  sm: "h-8",  // 32px
  md: "h-10", // 40px (default)
  lg: "h-12"  // 48px
};

export const Logo = ({ size = "md", onClick, className }: LogoProps) => {
  return (
    <img 
      src={logo} 
      alt="Quizabl Logo" 
      className={cn(sizeMap[size], "w-auto", onClick && "cursor-pointer", className)}
      onClick={onClick}
    />
  );
};
