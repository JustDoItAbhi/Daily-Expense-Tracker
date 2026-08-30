# Daily Expense Tracker — Product Requirements (Frontend MVP)

## Overview
A modern, minimal Expo (React Native) mobile app that lets users record daily expenses, set a daily spending limit, and see remaining budget instantly. Includes a separate Admin dashboard. Frontend-only with mock/AsyncStorage-backed data (backend can be swapped in later).

## Stack
- Expo Router (Stack + Tabs)
- React Native + TypeScript
- AsyncStorage (persistent state)
- react-native-gifted-charts + react-native-svg
- expo-image, expo-linear-gradient, @expo/vector-icons (Ionicons)
- Botanical / Emerald design system (Space Grotesk display, Plus Jakarta Sans body — currently using system fonts)

## Key Screens
- Auth: Login, Register (validation, error states, remember me)
- Dashboard: Greeting, Today's spending hero card with gradient scrim, progress bar, warning states (safe/warning/exceeded), 4 stat cards, Add Expense CTA, recent expenses
- Expenses: Search, quick range chips (All/Today/Yesterday/Week/Month), category chips, list w/ Empty state, tap to view detail
- Add Expense (modal): Big amount input, currency chips, product/notes fields, 8-tile category grid, auto date/time
- Expense Detail: Full metadata + Delete with confirmation modal
- Statistics: Period chips, stat cards (Total, Avg, Highest, Top category), last-7-days bar chart, category donut with legend
- Settings: Profile, Daily Budget, Currency (6 options), Appearance (Light/Dark/System), Admin shortcut (admin only), Logout
- Admin Dashboard: Overview (KPIs + line chart), Users (search/filter/activate), Expenses (delete), Categories (add/toggle/delete)

## Non-functional
- Dark mode + system-following theme (persisted)
- Full offline mock persistence
- SafeArea handled via insets, sticky headers, no SafeAreaView
- Every interactive/informational element has a `testID`

## Demo Accounts
See `/app/memory/test_credentials.md`.

## Currency
Default EUR. Supported: EUR, USD, GBP, INR, ALL, MKD.

## Categories (default)
Food, Clothing, Transport, Shopping, Bills, Entertainment, Health, Education, Travel, Other.

## API-ready architecture
Contexts (`AuthContext`, `ExpensesContext`, `ThemeContext`) encapsulate all data. Swapping AsyncStorage calls for Axios calls to `/api/*` endpoints is the only migration path.
