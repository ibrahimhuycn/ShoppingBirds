interface AppSettings {
  language: string;
  theme: string;
  autoSave: boolean;
  defaultStore: string;
  receiptPrinter: string;
  backupFrequency: string;
  lowStockAlert: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  language: "en",
  theme: "system",
  autoSave: true,
  defaultStore: "",
  receiptPrinter: "default",
  backupFrequency: "daily",
  lowStockAlert: 10,
};

export class SettingsService {
  private static readonly STORAGE_KEY = "shoppingbird_settings";

  /**
   * Load settings from localStorage
   */
  static loadSettings(): AppSettings {
    if (typeof window === 'undefined') {
      return DEFAULT_SETTINGS;
    }

    try {
      const savedSettings = localStorage.getItem(this.STORAGE_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }

    return DEFAULT_SETTINGS;
  }

  /**
   * Save settings to localStorage
   */
  static saveSettings(settings: AppSettings): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  }


  /**
   * Get default store ID from settings
   */
  static getDefaultStoreId(): string {
    const settings = this.loadSettings();
    return settings.defaultStore;
  }

  /**
   * Update theme and apply it to document
   */
  static applyTheme(theme: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (theme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      // System theme
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", prefersDark);
    }
  }
}

export type { AppSettings };
export { DEFAULT_SETTINGS };
