import { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { User, Shield, CreditCard, DollarSign, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const settingsNav = [
  { title: "Profile", url: "/settings/profile", icon: User },
  { title: "Account", url: "/settings/account", icon: Shield },
  { title: "Billing", url: "/settings/billing", icon: CreditCard },
];

interface SettingsLayoutProps {
  children: ReactNode;
}

export function SettingsLayout({ children }: SettingsLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
        
        <div className="grid md:grid-cols-[240px_1fr] gap-8">
          <aside className="space-y-2">
            <h2 className="text-lg font-semibold mb-4">Settings</h2>
            <nav className="flex flex-col gap-1">
              {settingsNav.map((item) => (
                <NavLink
                  key={item.url}
                  to={item.url}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.title}</span>
                </NavLink>
              ))}
            </nav>
          </aside>
          
          <main className="min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}