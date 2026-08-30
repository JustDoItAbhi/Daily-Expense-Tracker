import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { Category, Expense } from "../types";
import { DEMO_EXPENSES } from "../mock/seed";
import { DEFAULT_CATEGORIES } from "../mock/categories";
import { isSameDay } from "../utils/format";
import { useAuth } from "./AuthContext";

interface ExpensesCtx {
  expenses: Expense[]; // for current user (or all if admin)
  allExpenses: Expense[]; // everything
  categories: Category[];
  loading: boolean;
  addExpense: (payload: Omit<Expense, "id" | "userId" | "createdAt" | "expenseDate"> & { expenseDate?: string }) => Promise<Expense>;
  updateExpense: (id: string, patch: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  todayTotal: number;
  addCategory: (name: string, icon: string, color: string) => Promise<void>;
  updateCategory: (id: string, patch: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

const Ctx = createContext<ExpensesCtx | undefined>(undefined);
const EXP_KEY = "@expenses_all";
const CAT_KEY = "@categories_all";

async function loadAll(): Promise<Expense[]> {
  const raw = await AsyncStorage.getItem(EXP_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as Expense[];
    } catch {
      // ignore
    }
  }
  await AsyncStorage.setItem(EXP_KEY, JSON.stringify(DEMO_EXPENSES));
  return [...DEMO_EXPENSES];
}

async function saveAll(data: Expense[]) {
  await AsyncStorage.setItem(EXP_KEY, JSON.stringify(data));
}

async function loadCats(): Promise<Category[]> {
  const raw = await AsyncStorage.getItem(CAT_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as Category[];
    } catch {
      // ignore
    }
  }
  await AsyncStorage.setItem(CAT_KEY, JSON.stringify(DEFAULT_CATEGORIES));
  return [...DEFAULT_CATEGORIES];
}

async function saveCats(data: Category[]) {
  await AsyncStorage.setItem(CAT_KEY, JSON.stringify(data));
}

export function ExpensesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [exp, cats] = await Promise.all([loadAll(), loadCats()]);
      setAllExpenses(exp);
      setCategories(cats);
      setLoading(false);
    })();
  }, []);

  const expenses = useMemo(() => {
    if (!user) return [];
    if (user.role === "ROLE_ADMIN") return allExpenses;
    return allExpenses.filter((e) => e.userId === user.id);
  }, [user, allExpenses]);

  const todayTotal = useMemo(() => {
    if (!user) return 0;
    const now = new Date();
    return allExpenses
      .filter((e) => e.userId === user.id && isSameDay(e.expenseDate, now))
      .reduce((s, e) => s + e.amount, 0);
  }, [user, allExpenses]);

  const addExpense: ExpensesCtx["addExpense"] = useCallback(async (payload) => {
    if (!user) throw new Error("Not authenticated");
    const now = new Date().toISOString();
    const item: Expense = {
      id: `e_${Date.now()}`,
      userId: user.id,
      productName: payload.productName,
      amount: payload.amount,
      currency: payload.currency,
      categoryId: payload.categoryId,
      notes: payload.notes,
      expenseDate: payload.expenseDate ?? now,
      createdAt: now,
    };
    const next = [item, ...allExpenses];
    setAllExpenses(next);
    await saveAll(next);
    return item;
  }, [user, allExpenses]);

  const updateExpense: ExpensesCtx["updateExpense"] = useCallback(async (id, patch) => {
    const next = allExpenses.map((e) => (e.id === id ? { ...e, ...patch } : e));
    setAllExpenses(next);
    await saveAll(next);
  }, [allExpenses]);

  const deleteExpense: ExpensesCtx["deleteExpense"] = useCallback(async (id) => {
    const next = allExpenses.filter((e) => e.id !== id);
    setAllExpenses(next);
    await saveAll(next);
  }, [allExpenses]);

  const addCategory: ExpensesCtx["addCategory"] = useCallback(async (name, icon, color) => {
    const item: Category = {
      id: `cat_${Date.now()}`,
      name,
      icon,
      color,
      active: true,
    };
    const next = [...categories, item];
    setCategories(next);
    await saveCats(next);
  }, [categories]);

  const updateCategory: ExpensesCtx["updateCategory"] = useCallback(async (id, patch) => {
    const next = categories.map((c) => (c.id === id ? { ...c, ...patch } : c));
    setCategories(next);
    await saveCats(next);
  }, [categories]);

  const deleteCategory: ExpensesCtx["deleteCategory"] = useCallback(async (id) => {
    const next = categories.filter((c) => c.id !== id);
    setCategories(next);
    await saveCats(next);
  }, [categories]);

  const value = useMemo(
    () => ({
      expenses,
      allExpenses,
      categories,
      loading,
      addExpense,
      updateExpense,
      deleteExpense,
      todayTotal,
      addCategory,
      updateCategory,
      deleteCategory,
    }),
    [expenses, allExpenses, categories, loading, addExpense, updateExpense, deleteExpense, todayTotal, addCategory, updateCategory, deleteCategory]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useExpenses() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useExpenses must be within ExpensesProvider");
  return ctx;
}
