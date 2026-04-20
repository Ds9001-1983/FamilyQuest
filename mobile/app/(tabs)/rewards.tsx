import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CreateRewardModal } from "@/components/create-reward-modal";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { t } from "@/lib/i18n";

type Reward = {
  id: number;
  name: string;
  description?: string | null;
  requiredXP: number;
  icon: string;
};

export default function RewardsScreen() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isParent = user?.role === "parent";
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["rewards"],
    queryFn: () => api<Reward[]>("/api/rewards"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api(`/api/rewards/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rewards"] }),
  });

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-neutral-900">
      <View className="flex-row items-center justify-between border-b border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 px-4 pb-3 pt-2">
        <Text className="text-2xl font-bold text-mission-text dark:text-neutral-100">{t("tabs.rewards")}</Text>
        {isParent ? (
          <Pressable
            onPress={() => setShowCreate(true)}
            className="h-10 w-10 items-center justify-center rounded-full bg-mission-purple"
          >
            <Text className="text-2xl leading-6 text-white">+</Text>
          </Pressable>
        ) : null}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#059669" />
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(r) => String(r.id)}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor="#9333ea" />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-16">
              <Text className="text-center text-gray-500 dark:text-neutral-400">{t("rewards.empty")}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              onLongPress={() => {
                if (!isParent) return;
                Alert.alert(item.name, t("rewards.deletePrompt"), [
                  { text: t("app.cancel"), style: "cancel" },
                  {
                    text: t("app.delete"),
                    style: "destructive",
                    onPress: () => deleteMutation.mutate(item.id),
                  },
                ]);
              }}
              className="rounded-2xl bg-white dark:bg-neutral-800 p-4 shadow-sm"
            >
              <View className="flex-row items-center justify-between">
                <Text className="flex-1 text-base font-semibold text-mission-text dark:text-neutral-100" numberOfLines={2}>
                  {item.name}
                </Text>
                <View className="ml-3 rounded-full bg-mission-purple/10 px-3 py-1">
                  <Text className="text-sm font-bold text-mission-purple">{item.requiredXP} XP</Text>
                </View>
              </View>
              {item.description ? (
                <Text className="mt-1 text-sm text-gray-500 dark:text-neutral-400" numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}
            </Pressable>
          )}
        />
      )}

      <CreateRewardModal visible={showCreate} onClose={() => setShowCreate(false)} />
    </SafeAreaView>
  );
}
