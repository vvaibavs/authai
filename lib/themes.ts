export type Theme = {
  colors: {
    background: string;
    surface: string;
    surfaceHover: string;
    border: string;
    borderLight: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    primary: string;
    primaryHover: string;
    primaryLight: string;
    primaryText: string;
    error: string;
    errorBg: string;
    errorBorder: string;
    success: string;
    successBg: string;
    successBorder: string;
    spinner: string;
  };
};

export const themes = {
  light: {
    colors: {
      background: "#f9fafb",
      surface: "#ffffff",
      surfaceHover: "#f9fafb",
      border: "#e5e7eb",
      borderLight: "#f3f4f6",
      textPrimary: "#111827",
      textSecondary: "#374151",
      textMuted: "#9ca3af",
      primary: "#2563eb",
      primaryHover: "#1d4ed8",
      primaryLight: "#eff6ff",
      primaryText: "#1d4ed8",
      error: "#dc2626",
      errorBg: "#fef2f2",
      errorBorder: "#fecaca",
      success: "#15803d",
      successBg: "#f0fdf4",
      successBorder: "#bbf7d0",
      spinner: "#2563eb",
    },
  },
  dark: {
    colors: {
      background: "#0a0a0a",
      surface: "#171717",
      surfaceHover: "#1f1f1f",
      border: "#2e2e2e",
      borderLight: "#222222",
      textPrimary: "#ededed",
      textSecondary: "#a3a3a3",
      textMuted: "#525252",
      primary: "#3b82f6",
      primaryHover: "#2563eb",
      primaryLight: "#1e3a5f",
      primaryText: "#93c5fd",
      error: "#f87171",
      errorBg: "#2d1515",
      errorBorder: "#7f1d1d",
      success: "#4ade80",
      successBg: "#14291e",
      successBorder: "#166534",
      spinner: "#3b82f6",
    },
  },
} satisfies Record<string, Theme>;

export type ThemeKey = keyof typeof themes;

export const defaultTheme: ThemeKey = "light";
