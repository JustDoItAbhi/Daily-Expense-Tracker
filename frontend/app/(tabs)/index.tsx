import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";

import { useAuth } from "@/src/context/AuthContext";
import { useExpenses } from "@/src/context/ExpensesContext";
import { useTheme } from "@/src/context/ThemeContext";
import { formatCurrency, greeting, isSameDay, longDate } from "@/src/utils/format";
import StatCard from "@/src/components/StatCard";
import ExpenseRow from "@/src/components/ExpenseRow";
import EmptyState from "@/src/components/EmptyState";
import Button from "@/src/components/Button";

const HERO_BG = "https://images.unsplash.com/photo-1689443111287-5c2e129ec756?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGdyZWVuJTIwZ2VvbWV0cmljJTIwdGV4dHVyZXxlbnwwfHx8fDE3ODgxMjA1MjV8MA&ixlib=rb-4.1.0&q=85";

export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, radius } = useTheme();
  const { user } = useAuth();
  const { expenses, todayTotal } = useExpenses();
  const router = useRouter();

  const todayExpenses = useMemo(
    () => expenses.filter((e) => isSameDay(e.expenseDate, new Date())).sort((a, b) => (a.expenseDate < b.expenseDate ? 1 : -1)),
    [expenses]
  );

  const limit = user?.dailyLimit ?? 0;
  const remaining = limit - todayTotal;
  const percent = limit > 0 ? Math.min(999, (todayTotal / limit) * 100) : 0;
  const over = todayTotal > limit;
  const state: "safe" | "warning" | "exceeded" = over ? "exceeded" : percent >= 75 ? "warning" : "safe";

  const stateColor =
    state === "exceeded" ? colors.error : state === "warning" ? colors.warning : colors.success;

  const currency = user?.currency ?? "EUR";
  const firstName = user?.fullName.split(" ")[0] ?? "there";

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + spacing.md, paddingBottom: spacing.xxxl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: spacing.lg, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View>
            <Text style={{ color: colors.onSurfaceTertiary, fontSize: fontSize.sm }}>{longDate()}</Text>
            <Text style={{ color: colors.onSurface, fontSize: 26, fontWeight: "800", marginTop: 2 }}>
              {greeting()}, {firstName} 👋
            </Text>
          </View>
          <Pressable
            testID="dashboard-profile-button"
            onPress={() => router.push("/(tabs)/settings")}
            style={{ width: 40, height: 40, borderRadius: 999, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ color: colors.onBrandTertiary, fontWeight: "700" }}>{firstName[0]?.toUpperCase()}</Text>
          </Pressable>
        </View>

        {/* Hero card */}
        <View
          testID="hero-spending-card"
          style={{
            marginTop: spacing.lg,
            marginHorizontal: spacing.lg,
            height: 220,
            borderRadius: radius.lg,
            overflow: "hidden",
          }}
        >
          <Image source={HERO_BG} style={StyleSheet.absoluteFill} contentFit="cover" />
          <LinearGradient
            colors={["rgba(0,0,0,0.15)", "rgba(0,0,0,0.55)", "rgba(0,0,0,0.85)"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={{ flex: 1, padding: spacing.lg, justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: "#fff", fontSize: fontSize.sm, opacity: 0.85 }}>Today's Spending</Text>
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 999,
                  backgroundColor: stateColor + "33",
                  borderWidth: 1,
                  borderColor: stateColor,
                }}
              >
                <Text testID="budget-state-badge" style={{ color: "#fff", fontSize: 11, fontWeight: "700", letterSpacing: 0.4 }}>
                  {state === "exceeded" ? "OVER BUDGET" : state === "warning" ? "APPROACHING LIMIT" : "ON TRACK"}
                </Text>
              </View>
            </View>
            <View>
              <Text testID="today-total-amount" style={{ color: "#fff", fontSize: 40, fontWeight: "800", letterSpacing: -0.5 }}>
                {formatCurrency(todayTotal, currency)}
              </Text>
              <Text style={{ color: "#fff", opacity: 0.7, marginTop: 2 }}>
                of {formatCurrency(limit, currency)} daily limit
              </Text>
              <View style={{ marginTop: spacing.md, height: 8, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.2)", overflow: "hidden" }}>
                <View
                  style={{
                    height: "100%",
                    width: `${Math.min(100, percent)}%`,
                    backgroundColor: stateColor,
                    borderRadius: 999,
                  }}
                />
              </View>
              <Text style={{ color: "#fff", opacity: 0.8, marginTop: 6, fontSize: fontSize.sm }}>
                {over
                  ? `${formatCurrency(Math.abs(remaining), currency)} over budget`
                  : `${formatCurrency(remaining, currency)} remaining • ${Math.round(percent)}%`}
              </Text>
            </View>
          </View>
        </View>

        {/* Warning banner */}
        {state !== "safe" ? (
          <View
            style={{
              marginTop: spacing.md,
              marginHorizontal: spacing.lg,
              padding: spacing.md,
              borderRadius: radius.md,
              backgroundColor: stateColor + "1A",
              borderWidth: 1,
              borderColor: stateColor + "55",
            }}
          >
            <Text style={{ color: stateColor, fontWeight: "700" }}>
              {state === "exceeded" ? "🚨 Daily limit exceeded" : "⚠️ Approaching daily limit"}
            </Text>
            <Text style={{ color: colors.onSurface, marginTop: 4, fontSize: fontSize.sm }}>
              {state === "exceeded"
                ? `You've spent ${formatCurrency(todayTotal, currency)} of ${formatCurrency(limit, currency)}. Over budget: ${formatCurrency(Math.abs(remaining), currency)}.`
                : `Only ${formatCurrency(remaining, currency)} remaining today.`}
            </Text>
          </View>
        ) : null}

        {/* Stat cards */}
        <View style={{ flexDirection: "row", marginTop: spacing.lg, paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <StatCard testID="stat-today-card" icon="today-outline" label="Today's Spending" value={formatCurrency(todayTotal, currency)} />
          <StatCard testID="stat-limit-card" icon="flag-outline" label="Daily Limit" value={formatCurrency(limit, currency)} />
        </View>
        <View style={{ flexDirection: "row", marginTop: spacing.md, paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <StatCard
            testID="stat-remaining-card"
            icon={over ? "trending-down-outline" : "wallet-outline"}
            label="Remaining"
            value={formatCurrency(Math.max(0, remaining), currency)}
            tint={stateColor}
          />
          <StatCard testID="stat-txn-card" icon="receipt-outline" label="Transactions" value={String(todayExpenses.length)} />
        </View>

        {/* Add expense CTA */}
        <View style={{ marginTop: spacing.lg, paddingHorizontal: spacing.lg }}>
          <Button
            testID="add-expense-button"
            label="+ Add Expense"
            onPress={() => router.push("/add-expense")}
            icon={<Ionicons name="add-circle-outline" size={20} color={colors.onBrandPrimary} />}
          />
        </View>

        {/* Recent */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md }}>
            <Text style={{ color: colors.onSurface, fontSize: fontSize.lg, fontWeight: "700" }}>Recent Expenses</Text>
            <Pressable testID="view-all-expenses-link" onPress={() => router.push("/(tabs)/expenses")}>
              <Text style={{ color: colors.brandPrimary, fontWeight: "700" }}>View all →</Text>
            </Pressable>
          </View>
          {todayExpenses.length === 0 ? (
            <EmptyState
              testID="dashboard-empty-state"
              icon="wallet-outline"
              title="No expenses yet today"
              description="Start tracking your spending by adding your first expense."
              action={<Button label="+ Add Expense" onPress={() => router.push("/add-expense")} />}
            />
          ) : (
            <View style={{ gap: spacing.xs }}>
              {todayExpenses.slice(0, 5).map((e) => (
                <ExpenseRow key={e.id} expense={e} onPress={() => router.push({ pathname: "/expense/[id]", params: { id: e.id } })} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
