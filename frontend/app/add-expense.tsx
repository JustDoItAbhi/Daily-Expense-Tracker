import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useExpenses } from "@/src/context/ExpensesContext";
import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "@/src/context/ThemeContext";
import { Currency } from "@/src/types";
import InputField from "@/src/components/InputField";
import Button from "@/src/components/Button";
import { formatDateTime } from "@/src/utils/format";

const CURRENCIES: Currency[] = ["EUR", "USD", "GBP", "INR", "ALL", "MKD"];

export default function AddExpense() {
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, radius } = useTheme();
  const { user } = useAuth();
  const { categories, addExpense } = useExpenses();
  const router = useRouter();

  const [productName, setProductName] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>(user?.currency ?? "EUR");
  const [categoryId, setCategoryId] = useState<string>("food");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    const next: Record<string, string> = {};
    if (!productName.trim()) next.productName = "Product name is required.";
    const amt = parseFloat(amount);
    if (!amount) next.amount = "Amount is required.";
    else if (isNaN(amt) || amt <= 0) next.amount = "Amount must be greater than 0.";
    if (!categoryId) next.category = "Choose a category.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setSaving(true);
    await addExpense({
      productName: productName.trim(),
      amount: amt,
      currency,
      categoryId,
      notes: notes.trim() || undefined,
    });
    setSaving(false);
    router.back();
  };

  const activeCats = categories.filter((c) => c.active);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + spacing.sm,
          paddingBottom: spacing.sm,
          paddingHorizontal: spacing.lg,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Pressable testID="add-expense-close-button" onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="close" size={26} color={colors.onSurface} />
        </Pressable>
        <Text style={{ color: colors.onSurface, fontSize: fontSize.lg, fontWeight: "700" }}>New Expense</Text>
        <View style={{ width: 26 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 120 }} keyboardShouldPersistTaps="handled">
          {/* Big amount */}
          <View style={{ alignItems: "center", paddingVertical: spacing.lg }}>
            <Text style={{ color: colors.onSurfaceTertiary, fontSize: fontSize.sm, marginBottom: 6 }}>Amount</Text>
            <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
              <Text style={{ color: colors.onSurfaceTertiary, fontSize: 24, fontWeight: "700", marginRight: 6, marginBottom: 8 }}>
                {currency}
              </Text>
              <InputField
                testID="add-expense-amount-input"
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
                error={errors.amount}
              />
            </View>
          </View>

          {/* Currency */}
          <Text style={{ color: colors.onSurfaceSecondary, fontWeight: "700", marginBottom: 6 }}>Currency</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {CURRENCIES.map((c) => {
              const active = currency === c;
              return (
                <Pressable
                  key={c}
                  testID={`add-currency-${c}`}
                  onPress={() => setCurrency(c)}
                  style={{
                    height: 36,
                    paddingHorizontal: 14,
                    borderRadius: 999,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: active ? colors.brandPrimary : "transparent",
                    borderWidth: 1,
                    borderColor: active ? colors.brandPrimary : colors.border,
                    flexShrink: 0,
                  }}
                >
                  <Text style={{ color: active ? colors.onBrandPrimary : colors.onSurfaceSecondary, fontWeight: "600" }}>{c}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={{ height: spacing.lg }} />
          <InputField
            testID="add-expense-product-input"
            label="Product / Description"
            value={productName}
            onChangeText={setProductName}
            placeholder="e.g., Clothes"
            error={errors.productName}
          />

          {/* Category grid */}
          <Text style={{ color: colors.onSurfaceSecondary, fontWeight: "700", marginTop: spacing.lg, marginBottom: spacing.sm }}>Category</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            {activeCats.map((c) => {
              const active = categoryId === c.id;
              return (
                <Pressable
                  key={c.id}
                  testID={`add-category-${c.id}`}
                  onPress={() => setCategoryId(c.id)}
                  style={{
                    width: "22%",
                    aspectRatio: 1,
                    borderRadius: radius.md,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: active ? c.color + "22" : colors.surfaceSecondary,
                    borderWidth: active ? 1.5 : 1,
                    borderColor: active ? c.color : colors.border,
                  }}
                >
                  <Ionicons name={c.icon as any} size={22} color={active ? c.color : colors.onSurfaceTertiary} />
                  <Text style={{ color: active ? c.color : colors.onSurfaceSecondary, fontSize: 11, fontWeight: "600", marginTop: 4, textAlign: "center" }}>
                    {c.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={{ height: spacing.lg }} />
          <InputField
            testID="add-expense-notes-input"
            label="Notes (optional)"
            value={notes}
            onChangeText={setNotes}
            placeholder="Add a note"
            multiline
          />

          <View style={{ marginTop: spacing.lg, padding: spacing.md, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md }}>
            <Text style={{ color: colors.onSurfaceTertiary, fontSize: fontSize.sm }}>Date & time (auto)</Text>
            <Text style={{ color: colors.onSurface, fontWeight: "600", marginTop: 2 }}>{formatDateTime(new Date().toISOString())}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: insets.bottom + spacing.md,
          backgroundColor: colors.surface,
          borderTopColor: colors.divider,
          borderTopWidth: 1,
        }}
      >
        <Button testID="add-expense-save-button" label="Save Expense" onPress={onSave} loading={saving} />
      </View>
    </View>
  );
}
