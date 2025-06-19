import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Monitor } from "lucide-react";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center bg-gray-100 dark:bg-slate-700 rounded-md p-0.5">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setTheme("light")}
        className={`p-1.5 rounded-sm text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-slate-600 transition-colors ${
          theme === "light" ? "bg-white dark:bg-slate-600" : ""
        }`}
      >
        <Sun className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setTheme("dark")}
        className={`p-1.5 rounded-sm text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-slate-600 transition-colors ${
          theme === "dark" ? "bg-white dark:bg-slate-600" : ""
        }`}
      >
        <Moon className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setTheme("system")}
        className={`p-1.5 rounded-sm text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-slate-600 transition-colors ${
          theme === "system" ? "bg-white dark:bg-slate-600" : ""
        }`}
      >
        <Monitor className="h-3 w-3" />
      </Button>
    </div>
  );
}
