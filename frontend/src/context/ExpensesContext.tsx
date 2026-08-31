import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode, useRef } from "react";
import { Category, Expense } from "../types";
import { isSameDay } from "../utils/format";
import { useAuth } from "./AuthContext";
import { ExpenseRepository } from "../database/repositories/ExpenseRepository";
import { CategoryRepository } from "../database/repositories/CategoryRepository";
import { ensureSeed } from "../database/seed";
import { preferencesStorage } from "../storage/preferencesStorage";

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

export function ExpensesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const deviceIdRef = useRef<string>("");

  const refreshExpenses = useCallback(async () => {
    setAllExpenses(await ExpenseRepository.getAll());
  }, []);

  const refreshCategories = useCallback(async () => {
    setCategories(await CategoryRepository.getAll());
  }, []);

  useEffect(() => {
    (async () => {
      const deviceId = await preferencesStorage.getDeviceId();
      deviceIdRef.current = deviceId;
      await ensureSeed(deviceId);
      const [exp, cats] = await Promise.all([ExpenseRepository.getAll(), CategoryRepository.getAll()]);
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
    const created = await ExpenseRepository.create({
      userId: user.id,
      productName: payload.productName,
      amount: payload.amount,
      currency: payload.currency,
      categoryId: payload.categoryId,
      notes: payload.notes,
      expenseDate: payload.expenseDate,
      deviceId: deviceIdRef.current,
    });
    await refreshExpenses();
    return created;
  }, [user, refreshExpenses]);

  const updateExpense: ExpensesCtx["updateExpense"] = useCallback(async (id, patch) => {
    await ExpenseRepository.update(id, patch);
    await refreshExpenses();
  }, [refreshExpenses]);

  const deleteExpense: ExpensesCtx["deleteExpense"] = useCallback(async (id) => {
    await ExpenseRepository.softDelete(id);
    await refreshExpenses();
  }, [refreshExpenses]);

  const addCategory: ExpensesCtx["addCategory"] = useCallback(async (name, icon, color) => {
    await CategoryRepository.create(name, icon, color);
    await refreshCategories();
  }, [refreshCategories]);

  const updateCategory: ExpensesCtx["updateCategory"] = useCallback(async (id, patch) => {
    await CategoryRepository.update(id, patch);
    await refreshCategories();
  }, [refreshCategories]);

  const deleteCategory: ExpensesCtx["deleteCategory"] = useCallback(async (id) => {
    await CategoryRepository.softDelete(id);
    await refreshCategories();
  }, [refreshCategories]);

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
