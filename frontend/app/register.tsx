import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "@/src/context/ThemeContext";
import Button from "@/src/components/Button";
import InputField from "@/src/components/InputField";

export default function Register() {
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, radius } = useTheme();
  const { register } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    const next: Record<string, string> = {};
    if (!fullName.trim()) next.fullName = "Full name is required.";
    if (!email.trim()) next.email = "Email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = "Enter a valid email.";
    if (!password) next.password = "Password is required.";
    else if (password.length < 6) next.password = "Password must be at least 6 characters.";
    if (confirm !== password) next.confirm = "Passwords do not match.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setLoading(true);
    const res = await register(fullName.trim(), email.trim(), password);
    setLoading(false);
    if (!res.ok) {
      setErrors({ email: res.error || "Could not register." });
      return;
    }
    router.replace("/(tabs)");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, paddingTop: insets.top }}>
      <View style={{ flexDirection: "row", alignItems: "center", padding: spacing.lg }}>
        <Pressable testID="register-back-button" onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={colors.onSurface} />
        </Pressable>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: insets.bottom + spacing.xl }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={{ color: colors.onSurface, fontSize: 30, fontWeight: "800" }}>Create account</Text>
          <Text style={{ color: colors.onSurfaceTertiary, marginTop: 6 }}>Start tracking your daily spending in seconds.</Text>

          <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
            <InputField
              testID="register-fullname-input"
              label="Full name"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Jane Doe"
              error={errors.fullName}
              leading={<Ionicons name="person-outline" size={18} color={colors.onSurfaceTertiary} />}
            />
            <InputField
              testID="register-email-input"
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
              error={errors.email}
              leading={<Ionicons name="mail-outline" size={18} color={colors.onSurfaceTertiary} />}
            />
            <InputField
              testID="register-password-input"
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="At least 6 characters"
              error={errors.password}
              leading={<Ionicons name="lock-closed-outline" size={18} color={colors.onSurfaceTertiary} />}
            />
            <InputField
              testID="register-confirm-input"
              label="Confirm password"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              placeholder="Re-enter password"
              error={errors.confirm}
              leading={<Ionicons name="shield-checkmark-outline" size={18} color={colors.onSurfaceTertiary} />}
            />
          </View>

          <Button testID="register-submit-button" label="Create Account" onPress={onSubmit} loading={loading} style={{ marginTop: spacing.xl }} />

          <View style={{ flexDirection: "row", justifyContent: "center", marginTop: spacing.lg }}>
            <Text style={{ color: colors.onSurfaceTertiary }}>Already have an account? </Text>
            <Pressable testID="go-to-login-link" onPress={() => router.replace("/login")}>
              <Text style={{ color: colors.brandPrimary, fontWeight: "700" }}>Login</Text>
            </Pressable>
          </View>
          {/* keep radius reference to avoid unused warning */}
          <View style={{ height: radius.sm }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
