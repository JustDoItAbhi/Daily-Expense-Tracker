import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { User } from "../types";
import { CREDENTIALS, DEMO_ADMIN, DEMO_USER, DEMO_USERS } from "../mock/seed";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (fullName: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (patch: Partial<User>) => Promise<void>;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);
const USER_KEY = "@auth_user";
const TOKEN_KEY = "@auth_token";
const USERS_KEY = "@auth_users";

// In-memory user directory that persists in AsyncStorage
async function loadUsers(): Promise<User[]> {
  const raw = await AsyncStorage.getItem(USERS_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as User[];
    } catch {
      // ignore
    }
  }
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(DEMO_USERS));
  return [...DEMO_USERS];
}

async function saveUsers(users: User[]) {
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      await loadUsers();
      const raw = await AsyncStorage.getItem(USER_KEY);
      if (raw) {
        try {
          setUser(JSON.parse(raw) as User);
        } catch {
          // ignore
        }
      }
      setLoading(false);
    })();
  }, []);

  const persist = async (u: User | null) => {
    setUser(u);
    if (u) {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(u));
      await AsyncStorage.setItem(TOKEN_KEY, `mock_token_${u.id}`);
    } else {
      await AsyncStorage.removeItem(USER_KEY);
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    const users = await loadUsers();
    const match = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!match) return { ok: false, error: "No account found for this email." };
    const expected = CREDENTIALS[match.email];
    // Demo/admin have preset passwords; any registered user accepts stored password
    const registeredKey = `@auth_pw_${match.email}`;
    const stored = await AsyncStorage.getItem(registeredKey);
    const validPass = (expected && expected === password) || stored === password;
    if (!validPass) return { ok: false, error: "Incorrect password." };
    if (!match.active) return { ok: false, error: "Account deactivated." };
    await persist(match);
    return { ok: true };
  }, []);

  const register = useCallback(async (fullName: string, email: string, password: string) => {
    const users = await loadUsers();
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return { ok: false, error: "Email already registered." };
    }
    const newUser: User = {
      id: `u_${Date.now()}`,
      fullName,
      email,
      role: "ROLE_USER",
      currency: "EUR",
      dailyLimit: 150,
      createdAt: new Date().toISOString(),
      active: true,
    };
    const next = [...users, newUser];
    await saveUsers(next);
    await AsyncStorage.setItem(`@auth_pw_${email}`, password);
    await persist(newUser);
    return { ok: true };
  }, []);

  const logout = useCallback(async () => {
    await persist(null);
  }, []);

  const updateUser = useCallback(async (patch: Partial<User>) => {
    if (!user) return;
    const merged = { ...user, ...patch };
    const users = await loadUsers();
    const next = users.map((u) => (u.id === user.id ? merged : u));
    await saveUsers(next);
    await persist(merged);
  }, [user]);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, updateUser }),
    [user, loading, login, register, logout, updateUser]
  );

  // silence unused import
  void DEMO_USER;
  void DEMO_ADMIN;

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be within AuthProvider");
  return ctx;
}
