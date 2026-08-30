import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { useColorScheme } from "react-native";
import { darkColors, lightColors, ThemeColors, spacing, radius, fontSize } from "../theme";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeCtx {
  mode: ThemeMode;
  scheme: "light" | "dark";
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  fontSize: typeof fontSize;
  setMode: (m: ThemeMode) => void;
}

const Ctx = createContext<ThemeCtx | undefined>(undefined);
const KEY = "@theme_mode";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => {
      if (v === "light" || v === "dark" || v === "system") setModeState(v);
    });
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    AsyncStorage.setItem(KEY, m);
  }, []);

  const scheme: "light" | "dark" = mode === "system" ? (system === "dark" ? "dark" : "light") : mode;
  const colors = scheme === "dark" ? darkColors : lightColors;

  const value = useMemo(
    () => ({ mode, scheme, colors, spacing, radius, fontSize, setMode }),
    [mode, scheme, colors, setMode]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme must be within ThemeProvider");
  return ctx;
}
