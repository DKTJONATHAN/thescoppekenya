import { useState, useEffect } from "react";

export function useTheme() {
  // SSR FIX: Safely check if the browser window exists before reading localStorage
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const storedTheme = window.localStorage.getItem("theme");
      if (storedTheme === "dark" || storedTheme === "light") {
        return storedTheme;
      }
      // Check user system preference if no localStorage value exists
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
      }
    }
    // Default theme for the server render
    return "light";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);

    // SSR FIX: Safely check if the browser window exists before writing to localStorage
    if (typeof window !== "undefined") {
      window.localStorage.setItem("theme", theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "dark" ? "light" : "dark"));
  };

  return { theme, toggleTheme };
}