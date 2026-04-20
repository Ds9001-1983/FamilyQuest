import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PinInput } from "@/components/pin-input";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { t } from "@/lib/i18n";

type Member = {
  id: number;
  name: string | null;
  age: number | null;
  isParent: boolean;
  hasPin: boolean;
  totalXP: number;
};

export default function FamilyScreen() {
  const queryClient = useQueryClient();
  const { refreshKnownFamily } = useAuth();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["family-members"],
    queryFn: () => api<Member[]>("/api/family/members"),
  });

  const [pinTarget, setPinTarget] = useState<Member | null>(null);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);

  const setPinMutation = useMutation({
    mutationFn: ({ id, pin }: { id: number; pin: string }) =>
      api(`/api/family/members/${id}/pin`, {
        method: "PUT",
        body: { pin },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["family-members"] });
      await refreshKnownFamily();
      setPinTarget(null);
      setPin("");
      setPinError(null);
    },
    onError: (e) => setPinError(e instanceof ApiError ? e.message : "Fehler"),
  });

  const clearPinMutation = useMutation({
    mutationFn: (id: number) =>
      api(`/api/family/members/${id}/pin`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["family-members"] });
      await refreshKnownFamily();
    },
  });

  const children = (data ?? []).filter((m) => !m.isParent);

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-neutral-900">
      <Stack.Screen options={{ title: t("app.family"), headerShown: true }} />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#059669" />
        </View>
      ) : (
        <FlatList
          data={children}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshing={false}
          onRefresh={() => refetch()}
          ListHeaderComponent={
            <View className="mb-2">
              <Text className="text-base font-semibold text-mission-text dark:text-neutral-100">{t("family.childrenHeadline")}</Text>
              <Text className="mt-1 text-sm text-gray-500 dark:text-neutral-400">
                {t("family.pinHint")}
              </Text>
            </View>
          }
          ListEmptyComponent={
            <Text className="mt-8 text-center text-gray-500 dark:text-neutral-400">{t("family.emptyChildren")}</Text>
          }
          renderItem={({ item }) => (
            <View className="rounded-2xl bg-white dark:bg-neutral-800 p-4 shadow-sm">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-base font-semibold text-mission-text dark:text-neutral-100">
                    {item.name ?? t("family.unknownChild")}
                    {item.age != null ? ` (${item.age})` : ""}
                  </Text>
                  <Text className="mt-1 text-xs text-gray-500 dark:text-neutral-400">
                    {`${item.totalXP} XP · ${item.hasPin ? t("family.pinSet") : t("family.noPin")}`}
                  </Text>
                </View>
              </View>

              <View className="mt-3 flex-row gap-2">
                <Pressable
                  onPress={() => {
                    setPinTarget(item);
                    setPin("");
                    setPinError(null);
                  }}
                  className="flex-1 items-center rounded-xl bg-mission-green py-2"
                >
                  <Text className="text-sm font-semibold text-white">
                    {item.hasPin ? t("family.changePin") : t("family.setPin")}
                  </Text>
                </Pressable>
                {item.hasPin ? (
                  <Pressable
                    onPress={() => {
                      Alert.alert(
                        t("family.removePin"),
                        `${item.name ?? t("family.unknownChild")} ${t("family.removePinPrompt")}`,
                        [
                          { text: t("app.cancel"), style: "cancel" },
                          {
                            text: t("setup.remove"),
                            style: "destructive",
                            onPress: () => clearPinMutation.mutate(item.id),
                          },
                        ],
                      );
                    }}
                    className="flex-1 items-center rounded-xl border border-gray-300 dark:border-neutral-700 py-2"
                  >
                    <Text className="text-sm font-medium text-mission-text dark:text-neutral-100">{t("family.removePin")}</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          )}
          ListFooterComponent={
            <Pressable
              onPress={() => router.back()}
              className="mt-6 items-center rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 py-3"
            >
              <Text className="font-medium text-mission-text dark:text-neutral-100">{t("app.back")}</Text>
            </Pressable>
          }
        />
      )}

      <Modal visible={!!pinTarget} transparent animationType="fade" onRequestClose={() => setPinTarget(null)}>
        <View className="flex-1 items-center justify-center bg-black/40 px-6">
          <View className="w-full max-w-sm rounded-2xl bg-white dark:bg-neutral-800 p-6">
            <Text className="text-lg font-bold text-mission-text dark:text-neutral-100">
              {`${t("family.pinFor")} ${pinTarget?.name ?? t("family.unknownChild")}`}
            </Text>
            <Text className="mt-1 text-sm text-gray-600 dark:text-neutral-300">{t("family.pinDigits")}</Text>
            <PinInput
              value={pin}
              onChangeText={(next) => {
                setPin(next);
                setPinError(null);
              }}
              autoFocus
              className="mt-3 rounded-xl border border-gray-300 dark:border-neutral-700 px-4 py-3 text-center text-xl tracking-widest text-mission-text dark:text-neutral-100"
            />
            {pinError ? <Text className="mt-2 text-sm text-red-600">{pinError}</Text> : null}
            <View className="mt-4 flex-row gap-2">
              <Pressable
                onPress={() => {
                  setPinTarget(null);
                  setPin("");
                }}
                className="flex-1 items-center rounded-xl border border-gray-300 dark:border-neutral-700 py-3"
              >
                <Text className="font-medium text-mission-text dark:text-neutral-100">{t("app.cancel")}</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (pinTarget && pin.length >= 4) {
                    setPinMutation.mutate({ id: pinTarget.id, pin });
                  }
                }}
                disabled={pin.length < 4 || setPinMutation.isPending}
                className="flex-1 items-center rounded-xl bg-mission-green py-3 disabled:opacity-60"
              >
                <Text className="font-semibold text-white">
                  {setPinMutation.isPending ? t("app.loading") : t("app.save")}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
