import { Stack } from "expo-router";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/context/AuthContext";
import { View } from "react-native";

export default function AdminLayout() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== "ROLE_ADMIN")) {
      router.replace("/(tabs)");
    }
  }, [user, loading, router]);

  if (!user || user.role !== "ROLE_ADMIN") return <View />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
