import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, LayoutGrid, Table2 } from "lucide-react";

interface DashboardFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterType: string;
  onFilterChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  viewMode: "grid" | "list" | "table";
  onViewModeChange: (mode: "grid" | "list" | "table") => void;
}


const DashboardFilters = ({
  searchQuery,
  onSearchChange,
  filterType,
  onFilterChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
}: DashboardFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-fade-in">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search activities..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <Select value={filterType} onValueChange={onFilterChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Filter by type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="quiz">Quiz</SelectItem>
          <SelectItem value="flashcards">Flashcards</SelectItem>
          <SelectItem value="matching">Matching</SelectItem>
        </SelectContent>
      </Select>
      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="recent">Most Recent</SelectItem>
          <SelectItem value="oldest">Oldest First</SelectItem>
          <SelectItem value="az">A to Z</SelectItem>
          <SelectItem value="za">Z to A</SelectItem>
        </SelectContent>
      </Select>
      <div className="flex border rounded-md overflow-hidden shrink-0">
        <Button 
          variant={viewMode === "table" ? "default" : "ghost"} 
          size="sm"
          className="rounded-none h-10 px-3"
          onClick={() => onViewModeChange("table")}
          aria-label="Table view"
        >
          <Table2 className="w-4 h-4" />
        </Button>
        <Button 
          variant={viewMode === "grid" ? "default" : "ghost"} 
          size="sm" 
          className="rounded-none h-10 px-3"
          onClick={() => onViewModeChange("grid")}
          aria-label="Grid view"
        >
          <LayoutGrid className="w-4 h-4" />
        </Button>
      </div>

    </div>
  );
};

export default DashboardFilters;
