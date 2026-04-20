import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ApiError, api } from "@/lib/api";
import { digitsOnly } from "@/lib/text";
import { t } from "@/lib/i18n";

type FamilyMember = {
  id: number;
  name: string | null;
  age: number | null;
  isParent: boolean;
};

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function CreateMissionModal({ visible, onClose }: Props) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [xpReward, setXpReward] = useState("10");
  const [assignedTo, setAssignedTo] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const membersQuery = useQuery({
    queryKey: ["family-members"],
    queryFn: () => api<FamilyMember[]>("/api/family/members"),
    enabled: visible,
  });
  const children = (membersQuery.data ?? []).filter((m) => !m.isParent);

  const mutation = useMutation({
    mutationFn: async () =>
      api("/api/missions", {
        method: "POST",
        body: {
          title: title.trim(),
          description: description.trim() || undefined,
          xpReward: parseInt(xpReward, 10) || 10,
          assignedToUserId: assignedTo,
          icon: "tasks",
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["missions"] });
      setTitle("");
      setDescription("");
      setXpReward("10");
      setAssignedTo(null);
      setError(null);
      onClose();
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : t("createMission.error")),
  });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-neutral-900">
        <View className="flex-row items-center justify-between border-b border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 px-4 py-3">
          <Pressable onPress={onClose}>
            <Text className="text-base text-gray-600 dark:text-neutral-300">{t("app.cancel")}</Text>
          </Pressable>
          <Text className="text-base font-semibold text-mission-text dark:text-neutral-100">{t("createMission.title")}</Text>
          <Pressable
            onPress={() => mutation.mutate()}
            disabled={!title.trim() || mutation.isPending}
          >
            <Text className={`text-base font-semibold ${title.trim() ? "text-mission-green" : "text-gray-400 dark:text-neutral-500"}`}>
              {mutation.isPending ? t("app.loading") : t("createMission.submit")}
            </Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Text className="mb-1 text-sm font-medium text-mission-text dark:text-neutral-100">{t("createMission.titleLabel")}</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t("createMission.titlePlaceholder")}
            className="mb-4 rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-3 text-mission-text dark:text-neutral-100"
          />

          <Text className="mb-1 text-sm font-medium text-mission-text dark:text-neutral-100">{t("createMission.descriptionLabel")}</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            className="mb-4 rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-3 text-mission-text dark:text-neutral-100"
          />

          <Text className="mb-1 text-sm font-medium text-mission-text dark:text-neutral-100">{t("createMission.xpLabel")}</Text>
          <TextInput
            value={xpReward}
            onChangeText={(v) => setXpReward(digitsOnly(v))}
            keyboardType="number-pad"
            className="mb-4 rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-3 text-mission-text dark:text-neutral-100"
          />

          <Text className="mb-1 text-sm font-medium text-mission-text dark:text-neutral-100">{t("createMission.assignLabel")}</Text>
          {membersQuery.isLoading ? (
            <ActivityIndicator />
          ) : children.length === 0 ? (
            <Text className="text-sm text-gray-500 dark:text-neutral-400">{t("createMission.noChildren")}</Text>
          ) : (
            <View className="gap-2">
              <Pressable
                onPress={() => setAssignedTo(null)}
                className={`rounded-xl border px-4 py-3 ${
                  assignedTo === null ? "border-mission-green bg-mission-green/10" : "border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                }`}
              >
                <Text className="text-mission-text dark:text-neutral-100">{t("createMission.unassigned")}</Text>
              </Pressable>
              {children.map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => setAssignedTo(c.id)}
                  className={`rounded-xl border px-4 py-3 ${
                    assignedTo === c.id ? "border-mission-green bg-mission-green/10" : "border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                  }`}
                >
                  <Text className="text-mission-text dark:text-neutral-100">
                    {c.name ?? t("family.unknownChild")}
                    {c.age != null ? ` (${c.age})` : ""}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {error ? <Text className="mt-3 text-sm text-red-600">{error}</Text> : null}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
