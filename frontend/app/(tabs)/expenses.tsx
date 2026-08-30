import { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useExpenses } from "@/src/context/ExpensesContext";
import { useTheme } from "@/src/context/ThemeContext";
import { isSameDay } from "@/src/utils/format";
import ExpenseRow from "@/src/components/ExpenseRow";
import EmptyState from "@/src/components/EmptyState";
import Button from "@/src/components/Button";

const RANGES = ["All", "Today", "Yesterday", "This Week", "This Month"] as const;
type Range = (typeof RANGES)[number];

function withinRange(date: string, range: Range): boolean {
  const d = new Date(date);
  const now = new Date();
  if (range === "All") return true;
  if (range === "Today") return isSameDay(d, now);
  if (range === "Yesterday") {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    return isSameDay(d, y);
  }
  if (range === "This Week") {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    return d >= start;
  }
  if (range === "This Month") {
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }
  return true;
}

export default function ExpensesPage() {
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, radius } = useTheme();
  const { expenses, categories } = useExpenses();
  const router = useRouter();

  const [range, setRange] = useState<Range>("All");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return expenses
      .filter((e) => withinRange(e.expenseDate, range))
      .filter((e) => (categoryId ? e.categoryId === categoryId : true))
      .filter((e) => (search ? e.productName.toLowerCase().includes(search.toLowerCase()) : true))
      .sort((a, b) => (a.expenseDate < b.expenseDate ? 1 : -1));
  }, [expenses, range, categoryId, search]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      {/* Sticky Header */}
      <View style={{ paddingTop: insets.top + spacing.sm, paddingHorizontal: spacing.lg, backgroundColor: colors.surface }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ color: colors.onSurface, fontSize: 28, fontWeight: "800" }}>My Expenses</Text>
          <Pressable
            testID="expenses-add-button"
            onPress={() => router.push("/add-expense")}
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              backgroundColor: colors.brandPrimary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="add" size={24} color={colors.onBrandPrimary} />
          </Pressable>
        </View>

        {/* Search */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: spacing.md,
            backgroundColor: colors.surfaceSecondary,
            borderRadius: radius.md,
            paddingHorizontal: spacing.md,
          }}
        >
          <Ionicons name="search-outline" size={18} color={colors.onSurfaceTertiary} />
          <TextInput
            testID="expenses-search-input"
            placeholder="Search expenses"
            placeholderTextColor={colors.onSurfaceTertiary}
            value={search}
            onChangeText={setSearch}
            style={{ flex: 1, color: colors.onSurface, paddingVertical: spacing.md, paddingHorizontal: spacing.sm, fontSize: fontSize.base }}
          />
        </View>

        {/* Range chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: spacing.md }}
        >
          {RANGES.map((r) => {
            const active = range === r;
            return (
              <Pressable
                key={r}
                testID={`range-chip-${r.toLowerCase().replace(/\s+/g, "-")}`}
                onPress={() => setRange(r)}
                style={{
                  height: 36,
                  paddingHorizontal: 14,
                  borderRadius: 999,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: active ? colors.brandPrimary : colors.surfaceSecondary,
                  borderWidth: 1,
                  borderColor: active ? colors.brandPrimary : colors.border,
                  flexShrink: 0,
                }}
              >
                <Text style={{ color: active ? colors.onBrandPrimary : colors.onSurfaceSecondary, fontWeight: "600", fontSize: 13 }}>
                  {r}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Category chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: spacing.md }}
        >
          <Pressable
            testID="category-chip-all"
            onPress={() => setCategoryId(null)}
            style={{
              height: 36,
              paddingHorizontal: 14,
              borderRadius: 999,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: categoryId === null ? colors.brandSecondary : "transparent",
              borderWidth: 1,
              borderColor: categoryId === null ? colors.brandPrimary : colors.border,
              flexShrink: 0,
            }}
          >
            <Text style={{ color: categoryId === null ? colors.onBrandSecondary : colors.onSurfaceSecondary, fontWeight: "600", fontSize: 13 }}>
              All Categories
            </Text>
          </Pressable>
          {categories.filter((c) => c.active).map((c) => {
            const active = categoryId === c.id;
            return (
              <Pressable
                key={c.id}
                testID={`category-chip-${c.id}`}
                onPress={() => setCategoryId(active ? null : c.id)}
                style={{
                  height: 36,
                  paddingHorizontal: 14,
                  borderRadius: 999,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: active ? c.color + "33" : "transparent",
                  borderWidth: 1,
                  borderColor: active ? c.color : colors.border,
                  flexShrink: 0,
                  flexDirection: "row",
                  gap: 6,
                }}
              >
                <Ionicons name={c.icon as any} size={14} color={active ? c.color : colors.onSurfaceTertiary} />
                <Text style={{ color: active ? c.color : colors.onSurfaceSecondary, fontWeight: "600", fontSize: 13 }}>
                  {c.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(e) => e.id}
        contentContainerStyle={{ padding: spacing.lg, paddingTop: 0, paddingBottom: spacing.xxxl, gap: spacing.xs }}
        renderItem={({ item }) => (
          <ExpenseRow expense={item} onPress={() => router.push({ pathname: "/expense/[id]", params: { id: item.id } })} />
        )}
        ListEmptyComponent={
          <EmptyState
            testID="expenses-empty-state"
            icon="wallet-outline"
            title="No expenses match your filters"
            description="Try adjusting your filters or add a new expense."
            action={<Button label="+ Add Expense" onPress={() => router.push("/add-expense")} />}
          />
        }
      />
    </View>
  );
}
