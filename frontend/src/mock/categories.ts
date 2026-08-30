import { Category } from "../types";

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "food", name: "Food", icon: "fast-food-outline", color: "#E8734B", active: true },
  { id: "clothing", name: "Clothing", icon: "shirt-outline", color: "#7B61B0", active: true },
  { id: "transport", name: "Transport", icon: "car-outline", color: "#5A9AC5", active: true },
  { id: "shopping", name: "Shopping", icon: "bag-handle-outline", color: "#D26A9E", active: true },
  { id: "bills", name: "Bills", icon: "receipt-outline", color: "#4B8E7A", active: true },
  { id: "entertainment", name: "Entertainment", icon: "game-controller-outline", color: "#C78E1A", active: true },
  { id: "health", name: "Health", icon: "medkit-outline", color: "#D14343", active: true },
  { id: "education", name: "Education", icon: "school-outline", color: "#3A7F65", active: true },
  { id: "travel", name: "Travel", icon: "airplane-outline", color: "#2D8A5E", active: true },
  { id: "other", name: "Other", icon: "ellipsis-horizontal-outline", color: "#7A8480", active: true },
];
