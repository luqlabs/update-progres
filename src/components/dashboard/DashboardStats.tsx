import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutGrid, TrendingUp, Calendar, Zap } from "lucide-react";

interface DashboardStatsProps {
  totalApps: number;
  mostUsedType: string;
  dateRange: string;
}

const DashboardStats = ({ totalApps, mostUsedType, dateRange }: DashboardStatsProps) => {
  const stats = [
    {
      title: "Total Apps",
      value: totalApps,
      icon: LayoutGrid,
      color: "text-primary",
    },
    {
      title: "Most Used",
      value: mostUsedType || "N/A",
      icon: TrendingUp,
      color: "text-accent",
    },
    {
      title: "Active Since",
      value: dateRange,
      icon: Calendar,
      color: "text-primary",
    },
    {
      title: "Quick Access",
      value: "Ready",
      icon: Zap,
      color: "text-accent",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-fade-in">
      {stats.map((stat, index) => (
        <Card
          key={stat.title}
          className="hover:border-foreground/30 transition-all"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className={`w-4 h-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DashboardStats;
