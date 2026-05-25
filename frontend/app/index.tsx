import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useAuth } from "@/src/context/AuthContext";
import { COLORS } from "@/src/theme/colors";

export default function Index() {
  const { user, ready } = useAuth();

  if (!ready) {
    return (
      <View style={styles.container} testID="boot-splash">
        <ActivityIndicator color={COLORS.warning} size="large" />
      </View>
    );
  }

  if (!user) return <Redirect href="/login" />;
  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.appBg,
    alignItems: "center",
    justifyContent: "center",
  },
});
