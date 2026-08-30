import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "@/src/context/AuthContext";
import { useTheme, ThemeMode } from "@/src/context/ThemeContext";
import { Currency } from "@/src/types";
import InputField from "@/src/components/InputField";
import Button from "@/src/components/Button";

const CURRENCIES: Currency[] = ["EUR", "USD", "GBP", "INR", "ALL", "MKD"];
const MODES: { key: ThemeMode; label: string; icon: keyof typeof import("@expo/vector-icons").Ionicons.glyphMap }[] = [
  { key: "light", label: "Light", icon: "sunny-outline" },
  { key: "dark", label: "Dark", icon: "moon-outline" },
  { key: "system", label: "System", icon: "phone-portrait-outline" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors, spacing, fontSize, radius } = useTheme();
  return (
    <View style={{ marginTop: spacing.xl, paddingHorizontal: spacing.lg }}>
      <Text style={{ color: colors.onSurfaceTertiary, fontSize: fontSize.sm, fontWeight: "700", letterSpacing: 0.5, marginBottom: spacing.sm }}>
        {title.toUpperCase()}
      </Text>
      <View style={{ backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, padding: spacing.lg }}>
        {children}
      </View>
    </View>
  );
}

export default function SettingsPage() {
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, radius, mode, setMode } = useTheme();
  const { user, updateUser, logout } = useAuth();
  const router = useRouter();

  const [name, setName] = useState(user?.fullName ?? "");
  const [limitStr, setLimitStr] = useState(String(user?.dailyLimit ?? 150));
  const [currency, setCurrency] = useState<Currency>(user?.currency ?? "EUR");
  const [saved, setSaved] = useState(false);

  const saveProfile = async () => {
    if (!name.trim()) return;
    await updateUser({ fullName: name.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const saveLimit = async () => {
    const v = parseFloat(limitStr);
    if (isNaN(v) || v <= 0) return;
    await updateUser({ dailyLimit: v });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const saveCurrency = async (c: Currency) => {
    setCurrency(c);
    await updateUser({ currency: c });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + spacing.md, paddingBottom: spacing.xxxl }}
      >
        <View style={{ paddingHorizontal: spacing.lg }}>
          <Text style={{ color: colors.onSurface, fontSize: 28, fontWeight: "800" }}>Settings</Text>
          <Text style={{ color: colors.onSurfaceTertiary, marginTop: 4 }}>Preferences, budget & account.</Text>
        </View>

        {/* Profile */}
        <Section title="Profile">
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.md }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 999,
                backgroundColor: colors.brandTertiary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: colors.onBrandTertiary, fontSize: 22, fontWeight: "800" }}>
                {(user?.fullName || "?")[0].toUpperCase()}
              </Text>
            </View>
            <View style={{ marginLeft: spacing.md, flex: 1 }}>
              <Text style={{ color: colors.onSurface, fontWeight: "700" }}>{user?.fullName}</Text>
              <Text style={{ color: colors.onSurfaceTertiary, fontSize: fontSize.sm }}>{user?.email}</Text>
              {user?.role === "ROLE_ADMIN" ? (
                <View style={{ marginTop: 4, alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, backgroundColor: colors.brandPrimary, borderRadius: 999 }}>
                  <Text style={{ color: colors.onBrandPrimary, fontSize: 10, fontWeight: "700" }}>ADMIN</Text>
                </View>
              ) : null}
            </View>
          </View>
          <InputField testID="settings-name-input" label="Full name" value={name} onChangeText={setName} />
          <View style={{ height: spacing.md }} />
          <Button testID="settings-save-profile-button" label="Save Profile" onPress={saveProfile} variant="secondary" />
        </Section>

        {/* Daily Budget */}
        <Section title="Daily Budget">
          <Text style={{ color: colors.onSurfaceTertiary, marginBottom: spacing.sm }}>
            Applies to each calendar day. Resets automatically every day.
          </Text>
          <InputField
            testID="settings-limit-input"
            label="Daily spending limit"
            value={limitStr}
            onChangeText={setLimitStr}
            keyboardType="decimal-pad"
          />
          <View style={{ height: spacing.md }} />
          <Button testID="settings-save-limit-button" label="Save Limit" onPress={saveLimit} />
        </Section>

        {/* Currency */}
        <Section title="Currency">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {CURRENCIES.map((c) => {
              const active = currency === c;
              return (
                <Pressable
                  key={c}
                  testID={`currency-chip-${c}`}
                  onPress={() => saveCurrency(c)}
                  style={{
                    paddingHorizontal: 14,
                    height: 36,
                    borderRadius: 999,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: active ? colors.brandPrimary : "transparent",
                    borderWidth: 1,
                    borderColor: active ? colors.brandPrimary : colors.border,
                  }}
                >
                  <Text style={{ color: active ? colors.onBrandPrimary : colors.onSurfaceSecondary, fontWeight: "600" }}>{c}</Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        {/* Appearance */}
        <Section title="Appearance">
          <View style={{ flexDirection: "row", gap: 8 }}>
            {MODES.map((m) => {
              const active = mode === m.key;
              return (
                <Pressable
                  key={m.key}
                  testID={`theme-chip-${m.key}`}
                  onPress={() => setMode(m.key)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: radius.md,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: active ? colors.brandTertiary : "transparent",
                    borderWidth: 1,
                    borderColor: active ? colors.brandPrimary : colors.border,
                  }}
                >
                  <Ionicons name={m.icon} size={20} color={active ? colors.brandPrimary : colors.onSurfaceTertiary} />
                  <Text style={{ color: active ? colors.brandPrimary : colors.onSurfaceSecondary, fontWeight: "600", marginTop: 4 }}>
                    {m.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        {/* Admin */}
        {user?.role === "ROLE_ADMIN" ? (
          <Section title="Admin">
            <Pressable
              testID="open-admin-button"
              onPress={() => router.push("/admin")}
              style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 34, height: 34, borderRadius: radius.md, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={colors.onBrandTertiary} />
                </View>
                <Text style={{ color: colors.onSurface, fontWeight: "600" }}>Open Admin Dashboard</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.onSurfaceTertiary} />
            </Pressable>
          </Section>
        ) : null}

        {/* Security */}
        <Section title="Security">
          <Pressable testID="change-password-button" style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Ionicons name="key-outline" size={18} color={colors.onSurfaceSecondary} />
              <Text style={{ color: colors.onSurface, fontWeight: "600" }}>Change password</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.onSurfaceTertiary} />
          </Pressable>
          <View style={{ height: 1, backgroundColor: colors.divider, marginVertical: spacing.sm }} />
          <Pressable
            testID="logout-button"
            onPress={async () => {
              await logout();
              router.replace("/login");
            }}
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6 }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Ionicons name="log-out-outline" size={18} color={colors.error} />
              <Text style={{ color: colors.error, fontWeight: "700" }}>Logout</Text>
            </View>
          </Pressable>
        </Section>

        {saved ? (
          <View style={{ marginTop: spacing.lg, marginHorizontal: spacing.lg, padding: spacing.md, backgroundColor: colors.success + "22", borderRadius: radius.md }}>
            <Text style={{ color: colors.success, fontWeight: "700" }}>Saved.</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
