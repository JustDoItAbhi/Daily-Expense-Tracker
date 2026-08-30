import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  action?: React.ReactNode;
  testID?: string;
}

export default function EmptyState({ icon = "cube-outline", title, description, action, testID }: Props) {
  const { colors, spacing, fontSize } = useTheme();
  return (
    <View testID={testID} style={[styles.wrap, { padding: spacing.xl }]}>
      <View style={[styles.icon, { backgroundColor: colors.brandTertiary }]}>
        <Ionicons name={icon} size={40} color={colors.onBrandTertiary} />
      </View>
      <Text style={{ color: colors.onSurface, fontSize: fontSize.xl, fontWeight: "700", marginTop: spacing.lg, textAlign: "center" }}>
        {title}
      </Text>
      {description ? (
        <Text style={{ color: colors.onSurfaceTertiary, fontSize: fontSize.base, marginTop: spacing.sm, textAlign: "center" }}>
          {description}
        </Text>
      ) : null}
      {action ? <View style={{ marginTop: spacing.lg }}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
  },
  icon: {
    width: 96,
    height: 96,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
});
