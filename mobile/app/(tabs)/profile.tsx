import { router } from "expo-router";
import { useState } from "react";
import { Alert, Linking, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ParentalGate } from "@/components/parental-gate";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { config } from "@/lib/config";
import { t } from "@/lib/i18n";

export default function ProfileScreen() {
  const { user, logout, deleteAccount } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gate, setGate] = useState<null | "delete" | "privacy" | "terms">(null);

  const openLink = (url: string) => {
    void Linking.openURL(url);
  };

  const handleDelete = async () => {
    if (!password) return;
    setError(null);
    setSubmitting(true);
    try {
      await deleteAccount(password);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("profile.deleteFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-neutral-900">
      <View className="border-b border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 px-4 pb-3 pt-2">
        <Text className="text-2xl font-bold text-mission-text dark:text-neutral-100">{t("profile.title")}</Text>
      </View>

      <View className="p-4">
        <View className="mb-4 rounded-2xl bg-white dark:bg-neutral-800 p-4">
          <Text className="text-xs uppercase text-gray-400 dark:text-neutral-500">
            {user?.role === "child" ? t("profile.childIn") : t("app.family")}
          </Text>
          <Text className="mt-1 text-lg font-semibold text-mission-text dark:text-neutral-100">
            {user?.role === "child" ? user?.name ?? t("family.unknownChild") : user?.familyName}
          </Text>
          <Text className="mt-1 text-sm text-gray-500 dark:text-neutral-400">
            {user?.role === "child" ? user?.familyName : user?.email}
          </Text>
        </View>

        {user?.role === "parent" ? (
          <Pressable
            onPress={() => router.push("/family")}
            className="mb-3 rounded-2xl bg-white dark:bg-neutral-800 p-4"
          >
            <Text className="text-base font-medium text-mission-text dark:text-neutral-100">{t("profile.manageFamily")}</Text>
            <Text className="mt-1 text-xs text-gray-500 dark:text-neutral-400">
              {t("profile.manageFamilySubtitle")}
            </Text>
          </Pressable>
        ) : null}

        <Pressable
          onPress={() => setGate("privacy")}
          className="mb-3 rounded-2xl bg-white dark:bg-neutral-800 p-4"
        >
          <Text className="text-base font-medium text-mission-text dark:text-neutral-100">{t("profile.privacy")}</Text>
          <Text className="mt-1 text-xs text-gray-500 dark:text-neutral-400">{t("profile.openInBrowser")}</Text>
        </Pressable>

        <Pressable
          onPress={() => setGate("terms")}
          className="mb-3 rounded-2xl bg-white dark:bg-neutral-800 p-4"
        >
          <Text className="text-base font-medium text-mission-text dark:text-neutral-100">{t("profile.terms")}</Text>
          <Text className="mt-1 text-xs text-gray-500 dark:text-neutral-400">{t("profile.openInBrowser")}</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            Alert.alert(t("profile.signOut"), t("profile.signOutPrompt"), [
              { text: t("app.cancel"), style: "cancel" },
              { text: t("profile.signOut"), style: "destructive", onPress: () => void logout() },
            ]);
          }}
          className="mb-3 rounded-2xl bg-white dark:bg-neutral-800 p-4"
        >
          <Text className="text-base font-medium text-mission-text dark:text-neutral-100">{t("profile.signOut")}</Text>
        </Pressable>

        {user?.role === "parent" && !confirmOpen ? (
          <Pressable onPress={() => setGate("delete")} className="rounded-2xl bg-white dark:bg-neutral-800 p-4">
            <Text className="text-base font-medium text-red-600">{t("profile.deleteAccount")}</Text>
            <Text className="mt-1 text-xs text-gray-500 dark:text-neutral-400">
              {t("profile.deleteAccountHint")}
            </Text>
          </Pressable>
        ) : user?.role === "parent" && confirmOpen ? (
          <View className="rounded-2xl bg-white dark:bg-neutral-800 p-4">
            <Text className="text-base font-semibold text-red-600">{t("profile.deleteAccountConfirmTitle")}</Text>
            <Text className="mt-1 text-sm text-gray-600 dark:text-neutral-300">{t("profile.deleteAccountConfirm")}</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder={t("app.password")}
              className="mt-3 rounded-xl border border-gray-300 dark:border-neutral-700 px-4 py-3 text-base text-mission-text dark:text-neutral-100"
            />
            {error ? <Text className="mt-2 text-sm text-red-600">{error}</Text> : null}
            <View className="mt-3 flex-row gap-2">
              <Pressable
                onPress={() => {
                  setConfirmOpen(false);
                  setPassword("");
                  setError(null);
                }}
                className="flex-1 items-center rounded-xl border border-gray-300 dark:border-neutral-700 py-3"
              >
                <Text className="font-medium text-mission-text dark:text-neutral-100">{t("app.cancel")}</Text>
              </Pressable>
              <Pressable
                onPress={handleDelete}
                disabled={!password || submitting}
                className="flex-1 items-center rounded-xl bg-red-600 py-3 disabled:opacity-60"
              >
                <Text className="font-semibold text-white">
                  {submitting ? t("profile.deleting") : t("app.delete")}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>

      <ParentalGate
        visible={gate !== null}
        onCancel={() => setGate(null)}
        onPass={() => {
          const action = gate;
          setGate(null);
          if (action === "delete") setConfirmOpen(true);
          else if (action === "privacy") openLink(config.privacyUrl);
          else if (action === "terms") openLink(config.termsUrl);
        }}
        title={
          gate === "delete"
            ? t("profile.parentalGateTitleDelete")
            : t("profile.parentalGateTitleAdult")
        }
      />
    </SafeAreaView>
  );
}
