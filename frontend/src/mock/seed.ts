import { User, Expense, Currency } from "../types";

const DAY = 24 * 60 * 60 * 1000;

function iso(offsetMs: number) {
  return new Date(Date.now() - offsetMs).toISOString();
}

export const DEMO_USER: User = {
  id: "u_demo",
  fullName: "Demo User",
  email: "demo@example.com",
  role: "ROLE_USER",
  currency: "EUR",
  dailyLimit: 150,
  createdAt: iso(30 * DAY),
  active: true,
};

export const DEMO_ADMIN: User = {
  id: "u_admin",
  fullName: "Admin User",
  email: "admin@example.com",
  role: "ROLE_ADMIN",
  currency: "EUR",
  dailyLimit: 200,
  createdAt: iso(60 * DAY),
  active: true,
};

export const DEMO_USERS: User[] = [
  DEMO_USER,
  DEMO_ADMIN,
  {
    id: "u_1",
    fullName: "John Doe",
    email: "john@example.com",
    role: "ROLE_USER",
    currency: "USD",
    dailyLimit: 120,
    createdAt: iso(12 * DAY),
    active: true,
  },
  {
    id: "u_2",
    fullName: "Jane Smith",
    email: "jane@example.com",
    role: "ROLE_USER",
    currency: "EUR",
    dailyLimit: 180,
    createdAt: iso(8 * DAY),
    active: true,
  },
  {
    id: "u_3",
    fullName: "Robert Lee",
    email: "robert@example.com",
    role: "ROLE_USER",
    currency: "GBP",
    dailyLimit: 100,
    createdAt: iso(3 * DAY),
    active: false,
  },
];

export const CREDENTIALS: Record<string, string> = {
  "demo@example.com": "Demo123!",
  "admin@example.com": "Admin123!",
};

// Generate realistic expenses for demo user across the last 21 days
function seedExpenses(): Expense[] {
  const now = Date.now();
  const templates: { name: string; category: string; amountRange: [number, number] }[] = [
    { name: "Lunch", category: "food", amountRange: [8, 20] },
    { name: "Coffee", category: "food", amountRange: [3, 6] },
    { name: "Groceries", category: "food", amountRange: [25, 80] },
    { name: "Dinner out", category: "food", amountRange: [15, 45] },
    { name: "Taxi", category: "transport", amountRange: [6, 22] },
    { name: "Metro pass", category: "transport", amountRange: [10, 40] },
    { name: "Fuel", category: "transport", amountRange: [30, 70] },
    { name: "T-shirt", category: "clothing", amountRange: [15, 35] },
    { name: "Sneakers", category: "clothing", amountRange: [55, 120] },
    { name: "Jacket", category: "clothing", amountRange: [40, 90] },
    { name: "Movie tickets", category: "entertainment", amountRange: [10, 25] },
    { name: "Streaming", category: "entertainment", amountRange: [8, 15] },
    { name: "Electricity", category: "bills", amountRange: [30, 65] },
    { name: "Internet", category: "bills", amountRange: [25, 45] },
    { name: "Pharmacy", category: "health", amountRange: [5, 30] },
    { name: "Books", category: "education", amountRange: [15, 40] },
    { name: "Weekend trip", category: "travel", amountRange: [80, 220] },
    { name: "Gift", category: "shopping", amountRange: [10, 50] },
    { name: "Household", category: "shopping", amountRange: [12, 40] },
    { name: "Misc", category: "other", amountRange: [3, 15] },
  ];

  const expenses: Expense[] = [];
  let id = 1;

  // Today: a few expenses so dashboard is meaningful
  const todayItems = [
    { name: "Clothes", category: "clothing", amount: 100, hours: 6 },
    { name: "Lunch", category: "food", amount: 12, hours: 11 },
    { name: "Taxi", category: "transport", amount: 8, hours: 14 },
  ];
  for (const t of todayItems) {
    const d = new Date();
    d.setHours(d.getHours() - t.hours);
    expenses.push({
      id: `e_${id++}`,
      userId: "u_demo",
      productName: t.name,
      amount: t.amount,
      currency: "EUR",
      categoryId: t.category,
      expenseDate: d.toISOString(),
      createdAt: d.toISOString(),
    });
  }

  // Past 20 days
  for (let d = 1; d <= 20; d++) {
    const count = 1 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      const t = templates[Math.floor(Math.random() * templates.length)];
      const amount = Math.round((t.amountRange[0] + Math.random() * (t.amountRange[1] - t.amountRange[0])) * 100) / 100;
      const when = new Date(now - d * DAY);
      when.setHours(9 + Math.floor(Math.random() * 12));
      when.setMinutes(Math.floor(Math.random() * 60));
      expenses.push({
        id: `e_${id++}`,
        userId: "u_demo",
        productName: t.name,
        amount,
        currency: "EUR",
        categoryId: t.category,
        expenseDate: when.toISOString(),
        createdAt: when.toISOString(),
      });
    }
  }

  return expenses;
}

export const DEMO_EXPENSES: Expense[] = seedExpenses();
