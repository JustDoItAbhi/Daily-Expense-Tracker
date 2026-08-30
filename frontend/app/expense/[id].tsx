import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useExpenses } from "@/src/context/ExpensesContext";
import { useTheme } from "@/src/context/ThemeContext";
import { formatCurrency, formatDateTime } from "@/src/utils/format";
import Button from "@/src/components/Button";
import CategoryIcon, { CategoryLabel } from "@/src/components/CategoryIcon";

export default function ExpenseDetail() {
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, radius } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { expenses, deleteExpense } = useExpenses();
  const router = useRouter();

  const expense = expenses.find((e) => e.id === id);
  const [confirming, setConfirming] = useState(false);

  if (!expense) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, paddingTop: insets.top, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: colors.onSurface }}>Expense not found</Text>
        <View style={{ height: 16 }} />
        <Button label="Back" variant="secondary" onPress={() => router.back()} />
      </View>
    );
  }

  const onDelete = async () => {
    await deleteExpense(expense.id);
    setConfirming(false);
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={{ paddingTop: insets.top + spacing.sm, paddingHorizontal: spacing.lg, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Pressable testID="detail-back-button" onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={colors.onSurface} />
        </Pressable>
        <Text style={{ color: colors.onSurface, fontWeight: "700", fontSize: fontSize.lg }}>Expense</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 100 }}>
        <View style={{ alignItems: "center", paddingVertical: spacing.xl }}>
          <CategoryIcon categoryId={expense.categoryId} size={72} />
          <Text style={{ color: colors.onSurface, fontSize: 28, fontWeight: "800", marginTop: spacing.md }}>
            {expense.productName}
          </Text>
          <CategoryLabel categoryId={expense.categoryId} />
          <Text style={{ color: colors.onSurface, fontSize: 40, fontWeight: "800", marginTop: spacing.md }}>
            {formatCurrency(expense.amount, expense.currency)}
          </Text>
        </View>

        <View style={{ backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md }}>
          <Row label="Date & time" value={formatDateTime(expense.expenseDate)} />
          <Row label="Currency" value={expense.currency} />
          <Row label="Notes" value={expense.notes || "—"} />
          <Row label="Created" value={formatDateTime(expense.createdAt)} />
        </View>
      </ScrollView>

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
          flexDirection: "row",
          gap: spacing.md,
        }}
      >
        <Button testID="detail-delete-button" label="Delete" variant="danger" onPress={() => setConfirming(true)} style={{ flex: 1 }} />
      </View>

      <Modal transparent visible={confirming} animationType="fade" onRequestClose={() => setConfirming(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", padding: spacing.xl }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl }}>
            <Text style={{ color: colors.onSurface, fontSize: fontSize.xl, fontWeight: "800" }}>Delete this expense?</Text>
            <Text style={{ color: colors.onSurfaceTertiary, marginTop: 6 }}>This action cannot be undone.</Text>
            <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.lg }}>
              <Button testID="confirm-cancel-button" label="Cancel" variant="secondary" onPress={() => setConfirming(false)} style={{ flex: 1 }} />
              <Button testID="confirm-delete-button" label="Delete" variant="danger" onPress={onDelete} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const { colors, fontSize } = useTheme();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
      <Text style={{ color: colors.onSurfaceTertiary, fontSize: fontSize.sm }}>{label}</Text>
      <Text style={{ color: colors.onSurface, fontWeight: "600", maxWidth: "60%", textAlign: "right" }}>{value}</Text>
    </View>
  );
}
