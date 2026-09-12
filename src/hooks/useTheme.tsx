import { createContext, useContext, useEffect, ReactNode } from "react";

/**
 * Dark-only theme. Light mode is intentionally disabled per product decision.
 */
type Theme = "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function applyDark() {
  const root = document.documentElement;
  root.classList.remove("light");
  root.classList.add("dark");
  root.style.colorScheme = "dark";
  try {
    localStorage.setItem("theme", "dark");
  } catch {
    /* ignore */
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    applyDark();
  }, []);

  const value: ThemeContextType = {
    theme: "dark",
    toggleTheme: () => {
      /* no-op: dark only */
    },
    setTheme: () => {
      /* no-op: dark only */
    },
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
