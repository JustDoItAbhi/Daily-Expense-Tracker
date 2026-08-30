import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useExpenses } from "../context/ExpensesContext";

interface Props {
  categoryId: string;
  size?: number;
  compact?: boolean;
}

export default function CategoryIcon({ categoryId, size = 44, compact }: Props) {
  const { colors, radius } = useTheme();
  const { categories } = useExpenses();
  const cat = useMemo(() => categories.find((c) => c.id === categoryId), [categories, categoryId]);

  const bg = cat?.color ? cat.color + (compact ? "22" : "22") : colors.brandTertiary;
  const fg = cat?.color ?? colors.onBrandTertiary;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.md,
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name={(cat?.icon ?? "ellipsis-horizontal-outline") as any} size={size * 0.5} color={fg} />
    </View>
  );
}

export function CategoryLabel({ categoryId }: { categoryId: string }) {
  const { categories } = useExpenses();
  const { colors, fontSize } = useTheme();
  const cat = categories.find((c) => c.id === categoryId);
  return <Text style={{ color: colors.onSurfaceTertiary, fontSize: fontSize.sm }}>{cat?.name ?? "Other"}</Text>;
}

// unused; kept to avoid tree-shake warnings
export const _s = StyleSheet.create({});
