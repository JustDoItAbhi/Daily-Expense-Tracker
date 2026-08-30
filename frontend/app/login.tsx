import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";

import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "@/src/context/ThemeContext";
import Button from "@/src/components/Button";
import InputField from "@/src/components/InputField";

const AUTH_BG = "https://images.unsplash.com/photo-1487700160041-babef9c3cb55?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MTJ8MHwxfHNlYXJjaHwxfHxjbGVhbiUyMG1pbmltYWxpc3QlMjBkZXNrJTIwcGxhbnR8ZW58MHx8fHwxNzg4MTIwNTI1fDA&ixlib=rb-4.1.0&q=85";

export default function Login() {
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, radius, scheme } = useTheme();
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("demo@example.com");
  const [password, setPassword] = useState("Demo123!");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    setError(undefined);
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    const res = await login(email.trim(), password);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.replace("/(tabs)");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={{ height: 320, width: "100%" }}>
        <Image source={AUTH_BG} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        <LinearGradient
          colors={["rgba(0,0,0,0)", scheme === "dark" ? colors.surface : "rgba(0,0,0,0.05)", colors.surface]}
          style={StyleSheet.absoluteFill}
        />
        <View style={{ position: "absolute", top: insets.top + spacing.lg, left: spacing.lg, flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: colors.brandPrimary, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="wallet-outline" size={18} color={colors.onBrandPrimary} />
          </View>
          <Text style={{ color: "#fff", fontSize: fontSize.lg, fontWeight: "700" }}>Expense Tracker</Text>
        </View>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ padding: spacing.xl, paddingBottom: insets.bottom + spacing.xl }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={{ color: colors.onSurface, fontSize: 30, fontWeight: "800" }}>Welcome back</Text>
          <Text style={{ color: colors.onSurfaceTertiary, marginTop: 6, fontSize: fontSize.base }}>
            Know where your money goes, every day.
          </Text>

          <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
            <InputField
              testID="login-email-input"
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
              leading={<Ionicons name="mail-outline" size={18} color={colors.onSurfaceTertiary} />}
            />
            <InputField
              testID="login-password-input"
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              leading={<Ionicons name="lock-closed-outline" size={18} color={colors.onSurfaceTertiary} />}
            />
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.md }}>
            <Pressable
              testID="remember-me-toggle"
              onPress={() => setRemember(!remember)}
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: radius.sm,
                  borderWidth: 1.5,
                  borderColor: remember ? colors.brandPrimary : colors.borderStrong,
                  backgroundColor: remember ? colors.brandPrimary : "transparent",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {remember ? <Ionicons name="checkmark" size={14} color={colors.onBrandPrimary} /> : null}
              </View>
              <Text style={{ color: colors.onSurfaceSecondary, fontSize: fontSize.sm }}>Remember me</Text>
            </Pressable>
            <Pressable testID="forgot-password-link">
              <Text style={{ color: colors.brandPrimary, fontSize: fontSize.sm, fontWeight: "600" }}>Forgot password?</Text>
            </Pressable>
          </View>

          {error ? (
            <View style={{ marginTop: spacing.md, backgroundColor: colors.error + "22", padding: spacing.md, borderRadius: radius.md }}>
              <Text style={{ color: colors.error, fontSize: fontSize.sm }}>{error}</Text>
            </View>
          ) : null}

          <Button testID="login-submit-button" label="Login" onPress={onLogin} loading={loading} style={{ marginTop: spacing.xl }} />

          <View style={{ flexDirection: "row", justifyContent: "center", marginTop: spacing.lg }}>
            <Text style={{ color: colors.onSurfaceTertiary }}>Don't have an account? </Text>
            <Pressable testID="go-to-register-link" onPress={() => router.push("/register")}>
              <Text style={{ color: colors.brandPrimary, fontWeight: "700" }}>Create account</Text>
            </Pressable>
          </View>

          <View style={{ marginTop: spacing.xl, padding: spacing.md, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md }}>
            <Text style={{ color: colors.onSurfaceTertiary, fontSize: fontSize.sm }}>Demo accounts</Text>
            <Text style={{ color: colors.onSurface, fontSize: fontSize.sm, marginTop: 4 }}>User: demo@example.com / Demo123!</Text>
            <Text style={{ color: colors.onSurface, fontSize: fontSize.sm }}>Admin: admin@example.com / Admin123!</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
