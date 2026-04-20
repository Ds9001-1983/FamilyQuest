import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ApiError, api } from "@/lib/api";
import { digitsOnly } from "@/lib/text";
import { t } from "@/lib/i18n";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function CreateRewardModal({ visible, onClose }: Props) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [requiredXP, setRequiredXP] = useState("50");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () =>
      api("/api/rewards", {
        method: "POST",
        body: {
          name: name.trim(),
          description: description.trim() || undefined,
          requiredXP: parseInt(requiredXP, 10) || 0,
          icon: "gift",
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
      setName("");
      setDescription("");
      setRequiredXP("50");
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
          <Text className="text-base font-semibold text-mission-text dark:text-neutral-100">{t("createReward.title")}</Text>
          <Pressable
            onPress={() => mutation.mutate()}
            disabled={!name.trim() || mutation.isPending}
          >
            <Text className={`text-base font-semibold ${name.trim() ? "text-mission-purple" : "text-gray-400 dark:text-neutral-500"}`}>
              {mutation.isPending ? t("app.loading") : t("createReward.submit")}
            </Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Text className="mb-1 text-sm font-medium text-mission-text dark:text-neutral-100">{t("createReward.nameLabel")}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t("createReward.namePlaceholder")}
            className="mb-4 rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-3 text-mission-text dark:text-neutral-100"
          />

          <Text className="mb-1 text-sm font-medium text-mission-text dark:text-neutral-100">{t("createReward.descriptionLabel")}</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            className="mb-4 rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-3 text-mission-text dark:text-neutral-100"
          />

          <Text className="mb-1 text-sm font-medium text-mission-text dark:text-neutral-100">{t("createReward.requiredXP")}</Text>
          <TextInput
            value={requiredXP}
            onChangeText={(v) => setRequiredXP(digitsOnly(v))}
            keyboardType="number-pad"
            className="mb-4 rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-3 text-mission-text dark:text-neutral-100"
          />

          {error ? <Text className="mt-3 text-sm text-red-600">{error}</Text> : null}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
