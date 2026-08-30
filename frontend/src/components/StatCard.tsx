import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  tint?: string;
  testID?: string;
}

export default function StatCard({ icon, label, value, tint, testID }: Props) {
  const { colors, spacing, fontSize, radius } = useTheme();
  return (
    <View
      testID={testID}
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceSecondary,
          padding: spacing.lg,
          borderRadius: radius.lg,
        },
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: colors.brandTertiary,
            borderRadius: radius.md,
          },
        ]}
      >
        <Ionicons name={icon} size={18} color={tint ?? colors.onBrandTertiary} />
      </View>
      <Text style={{ color: colors.onSurfaceTertiary, fontSize: fontSize.sm, marginTop: spacing.md }}>{label}</Text>
      <Text style={{ color: colors.onSurface, fontSize: fontSize.xl, fontWeight: "700", marginTop: 2 }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 108,
  },
  iconWrap: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
});
