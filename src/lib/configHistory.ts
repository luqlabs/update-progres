// Undo/Redo system for app configurations

import { AppConfig } from "@/pages/Builder";

export class ConfigHistory {
  private history: AppConfig[] = [];
  private currentIndex: number = -1;
  private maxHistorySize: number = 50;

  push(config: AppConfig) {
    // Remove any configs after current index (when undoing then making new changes)
    this.history = this.history.slice(0, this.currentIndex + 1);
    
    // Add new config
    this.history.push(JSON.parse(JSON.stringify(config)));
    this.currentIndex++;
    
    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.currentIndex--;
    }
  }

  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  undo(): AppConfig | null {
    if (!this.canUndo()) return null;
    this.currentIndex--;
    return JSON.parse(JSON.stringify(this.history[this.currentIndex]));
  }

  redo(): AppConfig | null {
    if (!this.canRedo()) return null;
    this.currentIndex++;
    return JSON.parse(JSON.stringify(this.history[this.currentIndex]));
  }

  clear() {
    this.history = [];
    this.currentIndex = -1;
  }

  getCurrent(): AppConfig | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
      return JSON.parse(JSON.stringify(this.history[this.currentIndex]));
    }
    return null;
  }
}
