import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BarChart, PieChart } from "react-native-gifted-charts";

import { useExpenses } from "@/src/context/ExpensesContext";
import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "@/src/context/ThemeContext";
import { formatCurrency, isSameDay } from "@/src/utils/format";
import EmptyState from "@/src/components/EmptyState";
import StatCard from "@/src/components/StatCard";

const PERIODS = ["Today", "Week", "Month", "Last Month"] as const;
type Period = (typeof PERIODS)[number];

function inPeriod(date: string, p: Period): boolean {
  const d = new Date(date);
  const now = new Date();
  if (p === "Today") return isSameDay(d, now);
  if (p === "Week") {
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return d >= start;
  }
  if (p === "Month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  if (p === "Last Month") {
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
  }
  return true;
}

export default function StatisticsPage() {
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, radius } = useTheme();
  const { expenses, categories } = useExpenses();
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>("Week");

  const filtered = useMemo(() => expenses.filter((e) => inPeriod(e.expenseDate, period)), [expenses, period]);

  const total = filtered.reduce((s, e) => s + e.amount, 0);
  const highest = filtered.reduce((h, e) => (e.amount > h ? e.amount : h), 0);

  // Category totals
  const catTotals = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((e) => {
      map[e.categoryId] = (map[e.categoryId] || 0) + e.amount;
    });
    return Object.entries(map)
      .map(([id, amount]) => ({ id, amount, cat: categories.find((c) => c.id === id) }))
      .sort((a, b) => b.amount - a.amount);
  }, [filtered, categories]);

  const topCategory = catTotals[0]?.cat?.name ?? "—";

  // Daily bar data (last 7 days regardless of period)
  const barData = useMemo(() => {
    const days: { label: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const total = expenses
        .filter((e) => isSameDay(e.expenseDate, d))
        .reduce((s, e) => s + e.amount, 0);
      days.push({
        label: ["S", "M", "T", "W", "T", "F", "S"][d.getDay()],
        value: Math.round(total),
      });
    }
    return days;
  }, [expenses]);

  const pieData = catTotals.map((c) => ({
    value: c.amount,
    color: c.cat?.color ?? colors.brandPrimary,
    text: c.cat?.name,
  }));

  const currency = user?.currency ?? "EUR";
  const avgDaily = period === "Week" ? total / 7 : period === "Month" ? total / new Date().getDate() : total;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + spacing.md, paddingBottom: spacing.xxxl }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: spacing.lg }}>
          <Text style={{ color: colors.onSurface, fontSize: 28, fontWeight: "800" }}>Statistics</Text>
          <Text style={{ color: colors.onSurfaceTertiary, marginTop: 4 }}>Understand where your money goes.</Text>
        </View>

        {/* Period chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}
        >
          {PERIODS.map((p) => {
            const active = period === p;
            return (
              <Pressable
                key={p}
                testID={`period-chip-${p.toLowerCase().replace(/\s+/g, "-")}`}
                onPress={() => setPeriod(p)}
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
                  {p}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {filtered.length === 0 ? (
          <EmptyState
            testID="stats-empty-state"
            icon="analytics-outline"
            title="Not enough data yet"
            description="Add a few expenses to see your spending insights."
          />
        ) : (
          <>
            {/* Stat cards */}
            <View style={{ flexDirection: "row", paddingHorizontal: spacing.lg, gap: spacing.md }}>
              <StatCard icon="cash-outline" label={`Total (${period})`} value={formatCurrency(total, currency)} testID="stat-total" />
              <StatCard icon="trending-up-outline" label="Avg. daily" value={formatCurrency(avgDaily, currency)} testID="stat-avg" />
            </View>
            <View style={{ flexDirection: "row", marginTop: spacing.md, paddingHorizontal: spacing.lg, gap: spacing.md }}>
              <StatCard icon="flame-outline" label="Highest expense" value={formatCurrency(highest, currency)} testID="stat-highest" />
              <StatCard icon="pricetag-outline" label="Top category" value={topCategory} testID="stat-top-cat" />
            </View>

            {/* Weekly bar */}
            <View
              testID="weekly-bar-chart"
              style={{
                marginTop: spacing.lg,
                marginHorizontal: spacing.lg,
                padding: spacing.lg,
                backgroundColor: colors.surfaceSecondary,
                borderRadius: radius.lg,
              }}
            >
              <Text style={{ color: colors.onSurface, fontSize: fontSize.lg, fontWeight: "700", marginBottom: spacing.md }}>
                Last 7 days
              </Text>
              <BarChart
                data={barData}
                barWidth={22}
                spacing={16}
                roundedTop
                hideRules
                xAxisThickness={0}
                yAxisThickness={0}
                yAxisTextStyle={{ color: colors.onSurfaceTertiary, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: colors.onSurfaceTertiary, fontSize: 10 }}
                frontColor={colors.brandPrimary}
                height={140}
                noOfSections={3}
              />
            </View>

            {/* Donut */}
            <View
              testID="category-donut-chart"
              style={{
                marginTop: spacing.lg,
                marginHorizontal: spacing.lg,
                padding: spacing.lg,
                backgroundColor: colors.surfaceSecondary,
                borderRadius: radius.lg,
                alignItems: "center",
              }}
            >
              <Text style={{ color: colors.onSurface, fontSize: fontSize.lg, fontWeight: "700", alignSelf: "flex-start", marginBottom: spacing.md }}>
                Spending by category
              </Text>
              <PieChart
                donut
                data={pieData.length > 0 ? pieData : [{ value: 1, color: colors.surfaceTertiary }]}
                radius={90}
                innerRadius={60}
                innerCircleColor={colors.surfaceSecondary}
                centerLabelComponent={() => (
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ color: colors.onSurfaceTertiary, fontSize: 11 }}>Total</Text>
                    <Text style={{ color: colors.onSurface, fontSize: 18, fontWeight: "800" }}>
                      {formatCurrency(total, currency)}
                    </Text>
                  </View>
                )}
              />
              {/* Legend */}
              <View style={{ marginTop: spacing.lg, alignSelf: "stretch", gap: 10 }}>
                {catTotals.map((c) => {
                  const pct = total > 0 ? (c.amount / total) * 100 : 0;
                  return (
                    <View key={c.id} style={{ flexDirection: "row", alignItems: "center" }}>
                      <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: c.cat?.color, marginRight: 10 }} />
                      <Text style={{ color: colors.onSurface, flex: 1 }}>{c.cat?.name}</Text>
                      <Text style={{ color: colors.onSurfaceTertiary, marginRight: 10 }}>{Math.round(pct)}%</Text>
                      <Text style={{ color: colors.onSurface, fontWeight: "700" }}>{formatCurrency(c.amount, currency)}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
