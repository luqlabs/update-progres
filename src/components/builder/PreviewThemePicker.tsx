import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type ThemeKey = "indigo" | "emerald" | "slate" | "blue" | "amber" | "sky";

interface ThemeOption {
  value: ThemeKey;
  label: string;
  swatch: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  { value: "indigo", label: "Indigo", swatch: "bg-gradient-to-br from-indigo-600 to-violet-700" },
  { value: "emerald", label: "Emerald", swatch: "bg-gradient-to-br from-emerald-600 to-teal-700" },
  { value: "slate", label: "Slate", swatch: "bg-gradient-to-br from-slate-600 to-slate-800" },
  { value: "blue", label: "Blue", swatch: "bg-gradient-to-br from-blue-600 to-cyan-600" },
  { value: "amber", label: "Amber", swatch: "bg-gradient-to-br from-amber-400 to-rose-300" },
  { value: "sky", label: "Sky", swatch: "bg-gradient-to-br from-sky-300 to-cyan-200" },
];

interface PreviewThemePickerProps {
  value: string;
  onChange: (theme: ThemeKey) => void;
}

const PreviewThemePicker = ({ value, onChange }: PreviewThemePickerProps) => {
  const current = THEME_OPTIONS.find((t) => t.value === value) ?? THEME_OPTIONS[0];

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">Theme</span>
      <Select value={current.value} onValueChange={(v) => onChange(v as ThemeKey)}>
        <SelectTrigger className="h-8 w-[140px] text-xs">
          <SelectValue>
            <span className="flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full ring-1 ring-border ${current.swatch}`} />
              {current.label}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {THEME_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className="text-xs">
              <span className="flex items-center gap-2">
                <span className={`h-3 w-3 rounded-full ring-1 ring-border ${opt.swatch}`} />
                {opt.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default PreviewThemePicker;
