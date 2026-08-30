import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { useTheme } from "../context/ThemeContext";

interface Props {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
  icon?: React.ReactNode;
}

export default function Button({ label, onPress, variant = "primary", loading, disabled, style, testID, icon }: Props) {
  const { colors, spacing, radius, fontSize } = useTheme();
  const bg =
    variant === "primary"
      ? colors.brandPrimary
      : variant === "secondary"
      ? colors.brandTertiary
      : variant === "danger"
      ? colors.error
      : "transparent";
  const fg =
    variant === "primary"
      ? colors.onBrandPrimary
      : variant === "secondary"
      ? colors.onBrandTertiary
      : variant === "danger"
      ? colors.onError
      : colors.onSurface;

  return (
    <Pressable
      testID={testID}
      onPress={disabled || loading ? undefined : onPress}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: bg,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          borderRadius: radius.pill,
          paddingVertical: spacing.md + 2,
          paddingHorizontal: spacing.xl,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon}
          <Text style={{ color: fg, fontSize: fontSize.lg, fontWeight: "700" }}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 48,
  },
});
