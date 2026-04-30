import { create } from "zustand";
import { persist } from "zustand/middleware";

const useThemeStore = create(
  persist(
    (set, get) => ({
      // State
      theme: "light", // 'light' or 'dark'

      // Actions
      setTheme: (theme) => {
        set({ theme });
        // Apply theme to document
        if (theme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      },

      toggleTheme: () => {
        const currentTheme = get().theme;
        const newTheme = currentTheme === "light" ? "dark" : "light";
        get().setTheme(newTheme);
      },

      // Initialize theme from system preference if not set
      initializeTheme: () => {
        const storedTheme = get().theme;

        // If no stored preference, check system preference
        if (!storedTheme) {
          const prefersDark = window.matchMedia(
            "(prefers-color-scheme: dark)"
          ).matches;
          get().setTheme(prefersDark ? "dark" : "light");
        } else {
          // Apply stored theme
          get().setTheme(storedTheme);
        }
      },
    }),
    {
      name: "zevio-theme", // LocalStorage key
      partialize: (state) => ({ theme: state.theme }), // Only persist theme
    }
  )
);

export { useThemeStore };
