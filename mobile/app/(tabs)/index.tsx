import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CreateMissionModal } from "@/components/create-mission-modal";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { t } from "@/lib/i18n";

type Mission = {
  id: number;
  title: string;
  description?: string | null;
  xpReward: number;
  assignedToUserId: number | null;
  completed: boolean;
  icon: string;
};

export default function MissionsScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["missions"],
    queryFn: () => api<Mission[]>("/api/missions"),
  });

  const completeMutation = useMutation({
    mutationFn: (id: number) => api(`/api/missions/${id}/complete`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["missions"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api(`/api/missions/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["missions"] }),
  });

  const isParent = user?.role === "parent";
  const promptActions = (m: Mission) => {
    const buttons: {
      text: string;
      style?: "default" | "cancel" | "destructive";
      onPress?: () => void;
    }[] = [
      { text: t("app.cancel"), style: "cancel" },
      { text: t("missions.markDone"), onPress: () => completeMutation.mutate(m.id) },
    ];
    if (isParent) {
      buttons.push({
        text: t("app.delete"),
        style: "destructive",
        onPress: () => deleteMutation.mutate(m.id),
      });
    }
    Alert.alert(m.title, t("missions.actionsPrompt"), buttons);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-neutral-900">
      <View className="flex-row items-center justify-between border-b border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 px-4 pb-3 pt-2">
        <View>
          <Text className="text-sm text-gray-500 dark:text-neutral-400">
            {user?.role === "child" ? t("missions.yourMissions") : t("missions.forFamily")}
          </Text>
          <Text className="text-2xl font-bold text-mission-text dark:text-neutral-100">
            {user?.role === "child" ? user?.name ?? t("family.unknownChild") : user?.familyName ?? t("app.family")}
          </Text>
        </View>
        {isParent ? (
          <Pressable
            onPress={() => setShowCreate(true)}
            className="h-10 w-10 items-center justify-center rounded-full bg-mission-green"
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
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor="#059669" />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-16">
              <Text className="text-center text-gray-500 dark:text-neutral-400">
                {t("missions.empty")}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => promptActions(item)} className="rounded-2xl bg-white dark:bg-neutral-800 p-4 shadow-sm">
              <View className="flex-row items-center justify-between">
                <Text className="flex-1 text-base font-semibold text-mission-text dark:text-neutral-100" numberOfLines={2}>
                  {item.title}
                </Text>
                <View className="ml-3 rounded-full bg-mission-green/10 px-3 py-1">
                  <Text className="text-sm font-bold text-mission-green">+{item.xpReward} XP</Text>
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

      <CreateMissionModal visible={showCreate} onClose={() => setShowCreate(false)} />
    </SafeAreaView>
  );
}
