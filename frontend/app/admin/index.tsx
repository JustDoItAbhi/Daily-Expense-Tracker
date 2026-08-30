import { useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LineChart } from "react-native-gifted-charts";

import { useTheme } from "@/src/context/ThemeContext";
import { useAuth } from "@/src/context/AuthContext";
import { useExpenses } from "@/src/context/ExpensesContext";
import { formatCurrency, formatDate, isSameDay } from "@/src/utils/format";
import StatCard from "@/src/components/StatCard";
import Button from "@/src/components/Button";
import InputField from "@/src/components/InputField";
import { User } from "@/src/types";

const TABS = ["Overview", "Users", "Expenses", "Categories"] as const;
type Tab = (typeof TABS)[number];

const USERS_KEY = "@auth_users";

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, radius } = useTheme();
  const { user } = useAuth();
  const { allExpenses, categories, deleteExpense, addCategory, updateCategory, deleteCategory } = useExpenses();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("Overview");

  const [users, setUsers] = useState<User[]>([]);
  const [userQuery, setUserQuery] = useState("");
  const [userFilter, setUserFilter] = useState<"all" | "active" | "inactive">("all");
  const [newCatName, setNewCatName] = useState("");
  const [showAddCat, setShowAddCat] = useState(false);
  const [viewingUser, setViewingUser] = useState<User | null>(null);

  // Load users list
  useEffect(() => {
    AsyncStorage.getItem(USERS_KEY).then((raw) => {
      if (raw) {
        try {
          setUsers(JSON.parse(raw) as User[]);
        } catch { /* noop */ }
      }
    });
  }, [tab]);

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.active).length;
  const totalExpenses = allExpenses.length;
  const totalSpending = allExpenses.reduce((s, e) => s + e.amount, 0);

  const last7days = useMemo(() => {
    const days: { value: number; label: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const total = allExpenses.filter((e) => isSameDay(e.expenseDate, d)).reduce((s, e) => s + e.amount, 0);
      days.push({ value: Math.round(total), label: ["S", "M", "T", "W", "T", "F", "S"][d.getDay()] });
    }
    return days;
  }, [allExpenses]);

  const filteredUsers = users
    .filter((u) => (userFilter === "all" ? true : userFilter === "active" ? u.active : !u.active))
    .filter((u) => (userQuery ? u.email.toLowerCase().includes(userQuery.toLowerCase()) || u.fullName.toLowerCase().includes(userQuery.toLowerCase()) : true));

  const toggleUserActive = async (u: User) => {
    const next = users.map((x) => (x.id === u.id ? { ...x, active: !x.active } : x));
    setUsers(next);
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(next));
  };

  const submitCategory = async () => {
    if (!newCatName.trim()) return;
    await addCategory(newCatName.trim(), "pricetag-outline", "#237A53");
    setNewCatName("");
    setShowAddCat(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={{ paddingTop: insets.top + spacing.sm, paddingHorizontal: spacing.lg, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Pressable testID="admin-back-button" onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={colors.onSurface} />
        </Pressable>
        <Text style={{ color: colors.onSurface, fontSize: fontSize.lg, fontWeight: "700" }}>Admin</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}>
        <Text style={{ color: colors.onSurface, fontSize: 26, fontWeight: "800" }}>Dashboard</Text>
        <Text style={{ color: colors.onSurfaceTertiary }}>Logged in as {user?.email}</Text>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>
        {TABS.map((t) => {
          const active = tab === t;
          return (
            <Pressable
              key={t}
              testID={`admin-tab-${t.toLowerCase()}`}
              onPress={() => setTab(t)}
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
              <Text style={{ color: active ? colors.onBrandPrimary : colors.onSurfaceSecondary, fontWeight: "600", fontSize: 13 }}>{t}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingTop: 0, paddingBottom: spacing.xxxl }}>
        {tab === "Overview" && (
          <>
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <StatCard testID="admin-total-users" icon="people-outline" label="Total Users" value={String(totalUsers)} />
              <StatCard testID="admin-active-users" icon="pulse-outline" label="Active Users" value={String(activeUsers)} />
            </View>
            <View style={{ flexDirection: "row", marginTop: spacing.md, gap: spacing.md }}>
              <StatCard testID="admin-total-expenses" icon="receipt-outline" label="Total Expenses" value={String(totalExpenses)} />
              <StatCard testID="admin-total-spending" icon="cash-outline" label="Total Spending" value={formatCurrency(totalSpending, "EUR")} />
            </View>

            <View style={{ marginTop: spacing.lg, padding: spacing.lg, backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg }}>
              <Text style={{ color: colors.onSurface, fontWeight: "700", fontSize: fontSize.lg, marginBottom: spacing.md }}>Expenses (last 7 days)</Text>
              <LineChart
                data={last7days}
                color={colors.brandPrimary}
                thickness={3}
                startFillColor={colors.brandPrimary}
                startOpacity={0.3}
                endOpacity={0}
                areaChart
                curved
                hideRules
                xAxisThickness={0}
                yAxisThickness={0}
                xAxisLabelTextStyle={{ color: colors.onSurfaceTertiary, fontSize: 10 }}
                yAxisTextStyle={{ color: colors.onSurfaceTertiary, fontSize: 10 }}
                height={140}
              />
            </View>
          </>
        )}

        {tab === "Users" && (
          <>
            <InputField
              testID="admin-users-search"
              value={userQuery}
              onChangeText={setUserQuery}
              placeholder="Search users"
              leading={<Ionicons name="search-outline" size={16} color={colors.onSurfaceTertiary} />}
            />
            <View style={{ flexDirection: "row", gap: 8, marginTop: spacing.md }}>
              {(["all", "active", "inactive"] as const).map((f) => {
                const active = userFilter === f;
                return (
                  <Pressable
                    key={f}
                    testID={`user-filter-${f}`}
                    onPress={() => setUserFilter(f)}
                    style={{
                      height: 34,
                      paddingHorizontal: 14,
                      borderRadius: 999,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: active ? colors.brandPrimary : colors.surfaceSecondary,
                      borderWidth: 1,
                      borderColor: active ? colors.brandPrimary : colors.border,
                    }}
                  >
                    <Text style={{ color: active ? colors.onBrandPrimary : colors.onSurfaceSecondary, fontWeight: "600", textTransform: "capitalize" }}>{f}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={{ marginTop: spacing.md, gap: 8 }}>
              {filteredUsers.map((u) => (
                <View key={u.id} style={{ backgroundColor: colors.surfaceSecondary, padding: spacing.md, borderRadius: radius.md, flexDirection: "row", alignItems: "center" }}>
                  <View style={{ width: 40, height: 40, borderRadius: 999, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ color: colors.onBrandTertiary, fontWeight: "700" }}>{u.fullName[0]}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={{ color: colors.onSurface, fontWeight: "700" }}>{u.fullName}</Text>
                    <Text style={{ color: colors.onSurfaceTertiary, fontSize: 12 }}>{u.email}</Text>
                    <Text style={{ color: colors.onSurfaceTertiary, fontSize: 11, marginTop: 2 }}>Joined {formatDate(u.createdAt)}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 6 }}>
                    <View
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 999,
                        backgroundColor: u.active ? colors.success + "33" : colors.error + "33",
                      }}
                    >
                      <Text style={{ color: u.active ? colors.success : colors.error, fontSize: 10, fontWeight: "700" }}>{u.active ? "ACTIVE" : "INACTIVE"}</Text>
                    </View>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <Pressable testID={`view-user-${u.id}`} onPress={() => setViewingUser(u)}>
                        <Text style={{ color: colors.brandPrimary, fontWeight: "700", fontSize: 12 }}>View</Text>
                      </Pressable>
                      <Pressable testID={`toggle-user-${u.id}`} onPress={() => toggleUserActive(u)}>
                        <Text style={{ color: u.active ? colors.error : colors.success, fontWeight: "700", fontSize: 12 }}>
                          {u.active ? "Deactivate" : "Activate"}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {tab === "Expenses" && (
          <View style={{ gap: 8 }}>
            {allExpenses.slice(0, 50).map((e) => {
              const owner = users.find((u) => u.id === e.userId);
              const cat = categories.find((c) => c.id === e.categoryId);
              return (
                <View key={e.id} style={{ backgroundColor: colors.surfaceSecondary, padding: spacing.md, borderRadius: radius.md, flexDirection: "row", alignItems: "center" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.onSurface, fontWeight: "700" }}>{e.productName}</Text>
                    <Text style={{ color: colors.onSurfaceTertiary, fontSize: 12 }}>
                      {cat?.name ?? "—"} • {owner?.email ?? "unknown"}
                    </Text>
                    <Text style={{ color: colors.onSurfaceTertiary, fontSize: 11 }}>{formatDate(e.expenseDate)}</Text>
                  </View>
                  <Text style={{ color: colors.onSurface, fontWeight: "800" }}>{formatCurrency(e.amount, e.currency)}</Text>
                  <Pressable testID={`admin-delete-expense-${e.id}`} onPress={() => deleteExpense(e.id)} style={{ marginLeft: 10 }}>
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}

        {tab === "Categories" && (
          <View style={{ gap: 8 }}>
            <Button testID="admin-add-category-button" label="+ Add Category" onPress={() => setShowAddCat(true)} variant="secondary" />
            {categories.map((c) => (
              <View key={c.id} style={{ backgroundColor: colors.surfaceSecondary, padding: spacing.md, borderRadius: radius.md, flexDirection: "row", alignItems: "center" }}>
                <View style={{ width: 36, height: 36, borderRadius: radius.md, backgroundColor: c.color + "22", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name={c.icon as any} size={18} color={c.color} />
                </View>
                <Text style={{ color: colors.onSurface, fontWeight: "700", flex: 1, marginLeft: spacing.md }}>{c.name}</Text>
                <Pressable
                  testID={`toggle-cat-${c.id}`}
                  onPress={() => updateCategory(c.id, { active: !c.active })}
                  style={{ marginRight: 12 }}
                >
                  <Text style={{ color: c.active ? colors.success : colors.error, fontSize: 12, fontWeight: "700" }}>
                    {c.active ? "ACTIVE" : "INACTIVE"}
                  </Text>
                </Pressable>
                <Pressable testID={`delete-cat-${c.id}`} onPress={() => deleteCategory(c.id)}>
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Category modal */}
      <Modal visible={showAddCat} transparent animationType="fade" onRequestClose={() => setShowAddCat(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", padding: spacing.xl }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl }}>
            <Text style={{ color: colors.onSurface, fontSize: fontSize.xl, fontWeight: "800", marginBottom: spacing.md }}>New Category</Text>
            <InputField testID="new-category-name" value={newCatName} onChangeText={setNewCatName} placeholder="Category name" label="Name" />
            <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.lg }}>
              <Button testID="cancel-cat-button" label="Cancel" variant="secondary" onPress={() => setShowAddCat(false)} style={{ flex: 1 }} />
              <Button testID="save-cat-button" label="Save" onPress={submitCategory} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* User details modal */}
      <Modal visible={!!viewingUser} transparent animationType="fade" onRequestClose={() => setViewingUser(null)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", padding: spacing.xl }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl }}>
            <Text style={{ color: colors.onSurface, fontWeight: "800", fontSize: fontSize.xl }}>{viewingUser?.fullName}</Text>
            <Text style={{ color: colors.onSurfaceTertiary }}>{viewingUser?.email}</Text>
            <View style={{ marginTop: spacing.md, gap: 6 }}>
              <Text style={{ color: colors.onSurface }}>Role: {viewingUser?.role}</Text>
              <Text style={{ color: colors.onSurface }}>Currency: {viewingUser?.currency}</Text>
              <Text style={{ color: colors.onSurface }}>Daily limit: {formatCurrency(viewingUser?.dailyLimit ?? 0, viewingUser?.currency ?? "EUR")}</Text>
              <Text style={{ color: colors.onSurface }}>
                Total expenses: {allExpenses.filter((e) => e.userId === viewingUser?.id).length}
              </Text>
              <Text style={{ color: colors.onSurface }}>
                Total spending:{" "}
                {formatCurrency(
                  allExpenses.filter((e) => e.userId === viewingUser?.id).reduce((s, e) => s + e.amount, 0),
                  viewingUser?.currency ?? "EUR"
                )}
              </Text>
            </View>
            <View style={{ marginTop: spacing.lg }}>
              <Button testID="close-user-modal" label="Close" variant="secondary" onPress={() => setViewingUser(null)} />
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}
