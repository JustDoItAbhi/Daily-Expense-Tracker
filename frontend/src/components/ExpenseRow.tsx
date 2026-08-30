import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { Expense } from "../types";
import { formatCurrency, formatRelativeDate } from "../utils/format";
import CategoryIcon, { CategoryLabel } from "./CategoryIcon";

interface Props {
  expense: Expense;
  onPress?: () => void;
}

export default function ExpenseRow({ expense, onPress }: Props) {
  const { colors, spacing, fontSize, radius } = useTheme();
  return (
    <Pressable
      testID={`expense-row-${expense.id}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? colors.surfaceTertiary : colors.surface,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          borderRadius: radius.md,
        },
      ]}
    >
      <CategoryIcon categoryId={expense.categoryId} />
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Text numberOfLines={1} style={{ color: colors.onSurface, fontSize: fontSize.lg, fontWeight: "600" }}>
          {expense.productName}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2, gap: spacing.sm }}>
          <CategoryLabel categoryId={expense.categoryId} />
          <Text style={{ color: colors.onSurfaceTertiary, fontSize: fontSize.sm }}>•</Text>
          <Text style={{ color: colors.onSurfaceTertiary, fontSize: fontSize.sm }}>{formatRelativeDate(expense.expenseDate)}</Text>
        </View>
      </View>
      <Text style={{ color: colors.onSurface, fontSize: fontSize.lg, fontWeight: "700" }}>
        {formatCurrency(expense.amount, expense.currency)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
});
