import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { LogBox, StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { ThemeProvider, useTheme } from "@/src/context/ThemeContext";
import { AuthProvider } from "@/src/context/AuthContext";
import { ExpensesProvider } from "@/src/context/ExpensesContext";

LogBox.ignoreAllLogs(true);

SplashScreen.preventAutoHideAsync();

function AppShell() {
  const { colors, scheme } = useTheme();
  return (
    <>
      <StatusBar barStyle={scheme === "dark" ? "light-content" : "dark-content"} backgroundColor={colors.surface} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.surface },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="add-expense" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
        <Stack.Screen name="expense/[id]" />
        <Stack.Screen name="admin" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [loaded, error] = useIconFonts();

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <ExpensesProvider>
              <AppShell />
            </ExpensesProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
