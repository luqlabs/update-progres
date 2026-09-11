import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface CommandOption {
  value: string;
  label: string;
  icon: string;
  description?: string;
  color?: string;
}

export const QUIZ_TYPES: CommandOption[] = [
  { value: 'multiple-choice', label: 'Multiple Choice', icon: '✓', description: 'Classic quiz with options' },
  { value: 'true-false', label: 'True/False', icon: '✓✗', description: 'Yes or no questions' },
  { value: 'short-answer', label: 'Short Answer', icon: '✍️', description: 'Type brief answers' },
  { value: 'fill-blank', label: 'Fill in the Blank', icon: '___', description: 'Complete the sentence' },
  { value: 'poll', label: 'Poll', icon: '📊', description: 'Non-graded voting' },
  { value: 'word-cloud', label: 'Word Cloud', icon: '☁️', description: 'Collect word responses' },
  { value: 'open-ended', label: 'Open-Ended', icon: '💬', description: 'Free-form responses' },
  { value: 'slide', label: 'Instructional Slide', icon: '📄', description: 'Information only' }
];

export const THEMES: CommandOption[] = [
  { value: 'indigo', label: 'Indigo', icon: '●', color: 'from-indigo-700 to-violet-700' },
  { value: 'emerald', label: 'Emerald', icon: '●', color: 'from-emerald-700 to-teal-700' },
  { value: 'slate', label: 'Slate', icon: '●', color: 'from-slate-700 to-slate-500' },
  { value: 'blue', label: 'Blue', icon: '●', color: 'from-blue-700 to-cyan-600' },
  { value: 'amber', label: 'Amber', icon: '●', color: 'from-amber-400 to-rose-300' },
  { value: 'sky', label: 'Sky', icon: '●', color: 'from-sky-200 to-cyan-100' }
];

interface CommandAutocompleteProps {
  open: boolean;
  commandType: '/quiz' | '/theme' | null;
  onSelect: (value: string) => void;
  anchorEl?: HTMLElement | null;
}

export const CommandAutocomplete = ({ 
  open, 
  commandType, 
  onSelect 
}: CommandAutocompleteProps) => {
  if (!commandType || !open) return null;

  const options = commandType === '/quiz' ? QUIZ_TYPES : THEMES;
  const title = commandType === '/quiz' ? 'Select Question Type' : 'Select Theme';

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2">
      <div className="bg-popover border rounded-lg shadow-none max-h-[400px] overflow-hidden">
        <Command className="rounded-lg">
          <div className="px-3 py-2 border-b">
            <p className="text-sm font-medium text-foreground">{title}</p>
          </div>
          <CommandGroup className="max-h-[350px] overflow-y-auto p-2">
            {options.map((option) => (
              <CommandItem
                key={option.value}
                onSelect={() => onSelect(option.value)}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-3 w-full">
                  <span className="text-xl">{option.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{option.label}</div>
                    {option.description && (
                      <div className="text-xs text-muted-foreground">
                        {option.description}
                      </div>
                    )}
                  </div>
                  {option.color && (
                    <div className={`w-8 h-8 rounded bg-gradient-to-br ${option.color}`} />
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </div>
    </div>
  );
};
