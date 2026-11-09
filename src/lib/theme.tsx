"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark";

const THEME_KEY = "realbiz-theme";
const PRIMARY_KEY = "realbiz-primary";
const DEFAULT_PRIMARY = "#2ed573";

interface ThemeContextType {
  theme: Theme;
  primaryColor: string;
  toggle: () => void;
  toggleTheme: () => void;
  setPrimaryColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  primaryColor: DEFAULT_PRIMARY,
  toggle: () => {},
  toggleTheme: () => {},
  setPrimaryColor: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [primaryColor, setPrimaryColorState] = useState(DEFAULT_PRIMARY);
  const [hydrated, setHydrated] = useState(false); // ✅ important

  // 1) প্রথমে localStorage থেকে পড়ুন
  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_KEY);
    if (storedTheme === "dark" || storedTheme === "light") {
      setTheme(storedTheme);
    }

    const storedPrimary = window.localStorage.getItem(PRIMARY_KEY);
    if (storedPrimary) {
      setPrimaryColorState(storedPrimary);
    }

    setHydrated(true); // ✅ এখন থেকে save করা যাবে
  }, []);

  // 2) hydrated হওয়ার পরেই CSS + localStorage update
  useEffect(() => {
    if (!hydrated) return; // ✅ default দিয়ে overwrite হবে না

    const root = document.documentElement;

    root.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem(THEME_KEY, theme);

    root.style.setProperty("--color-primary", primaryColor);
    root.style.setProperty("--color-primary-hover", primaryColor);
    root.style.setProperty("--color-primary-light", `${primaryColor}18`);
    root.style.setProperty("--primary", primaryColor);

    window.localStorage.setItem(PRIMARY_KEY, primaryColor);
  }, [theme, primaryColor, hydrated]);

  const toggle = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  const setPrimaryColor = (color: string) => {
    setPrimaryColorState(color);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        primaryColor,
        toggle,
        toggleTheme: toggle,
        setPrimaryColor,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
