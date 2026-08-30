import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { useTheme } from "../context/ThemeContext";

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  testID?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
}

export default function InputField({ label, error, leading, trailing, testID, ...rest }: Props) {
  const { colors, spacing, radius, fontSize } = useTheme();
  return (
    <View style={{ width: "100%" }}>
      {label ? (
        <Text style={{ color: colors.onSurfaceSecondary, fontSize: fontSize.sm, marginBottom: 6, fontWeight: "600" }}>
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.wrap,
          {
            backgroundColor: colors.surfaceSecondary,
            borderRadius: radius.md,
            paddingHorizontal: spacing.md,
            borderColor: error ? colors.error : colors.border,
          },
        ]}
      >
        {leading}
        <TextInput
          testID={testID}
          placeholderTextColor={colors.onSurfaceTertiary}
          style={{
            flex: 1,
            color: colors.onSurface,
            fontSize: fontSize.lg,
            paddingVertical: spacing.md + 2,
            paddingHorizontal: leading ? spacing.sm : 0,
          }}
          {...rest}
        />
        {trailing}
      </View>
      {error ? (
        <Text style={{ color: colors.error, fontSize: fontSize.sm, marginTop: 4 }}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
  },
});
