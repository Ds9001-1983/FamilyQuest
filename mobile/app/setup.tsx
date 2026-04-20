import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ApiError, api } from "@/lib/api";
import { digitsOnly } from "@/lib/text";
import { useAuth } from "@/lib/auth";
import { t } from "@/lib/i18n";

type ChildInput = { name: string; age: string };
type RewardInput = { name: string; description: string; xpCost: string };

export default function SetupScreen() {
  const { refresh } = useAuth();
  const [children, setChildren] = useState<ChildInput[]>([{ name: "", age: "" }]);
  const [rewards, setRewards] = useState<RewardInput[]>([{ name: "", description: "", xpCost: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addChild = () => setChildren((s) => [...s, { name: "", age: "" }]);
  const updateChild = (i: number, patch: Partial<ChildInput>) =>
    setChildren((s) => s.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  const removeChild = (i: number) =>
    setChildren((s) => (s.length > 1 ? s.filter((_, idx) => idx !== i) : s));

  const addReward = () => setRewards((s) => [...s, { name: "", description: "", xpCost: "" }]);
  const updateReward = (i: number, patch: Partial<RewardInput>) =>
    setRewards((s) => s.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const removeReward = (i: number) =>
    setRewards((s) => (s.length > 1 ? s.filter((_, idx) => idx !== i) : s));

  const handleSubmit = async () => {
    setError(null);
    const cleanChildren = children
      .map((c) => ({ name: c.name.trim(), age: parseInt(c.age, 10) }))
      .filter((c) => c.name.length > 0 && Number.isFinite(c.age));
    const cleanRewards = rewards
      .map((r) => ({
        name: r.name.trim(),
        description: r.description.trim() || undefined,
        xpCost: parseInt(r.xpCost, 10),
      }))
      .filter((r) => r.name.length > 0 && Number.isFinite(r.xpCost));

    if (cleanChildren.length === 0) {
      setError(t("setup.needOneChild"));
      return;
    }

    setSubmitting(true);
    try {
      await api("/api/family/setup", {
        method: "POST",
        body: { children: cleanChildren, rewards: cleanRewards },
      });
      await refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("setup.failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-neutral-900">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <Text className="text-2xl font-bold text-mission-text dark:text-neutral-100">{t("setup.title")}</Text>
        <Text className="mt-1 text-base text-gray-500 dark:text-neutral-400">
          {t("setup.subtitle")}
        </Text>

        <Text className="mb-2 mt-6 text-base font-semibold text-mission-text dark:text-neutral-100">{t("setup.children")}</Text>
        {children.map((c, i) => (
          <View key={i} className="mb-3 rounded-2xl bg-white dark:bg-neutral-800 p-4">
            <View className="flex-row gap-2">
              <TextInput
                value={c.name}
                onChangeText={(v) => updateChild(i, { name: v })}
                placeholder={t("setup.name")}
                className="flex-[2] rounded-xl border border-gray-300 dark:border-neutral-700 px-3 py-2 text-mission-text dark:text-neutral-100"
              />
              <TextInput
                value={c.age}
                onChangeText={(v) => updateChild(i, { age: digitsOnly(v) })}
                placeholder={t("setup.age")}
                keyboardType="number-pad"
                className="flex-1 rounded-xl border border-gray-300 dark:border-neutral-700 px-3 py-2 text-mission-text dark:text-neutral-100"
              />
            </View>
            {children.length > 1 ? (
              <Pressable onPress={() => removeChild(i)} className="mt-2 self-end">
                <Text className="text-sm text-red-600">{t("setup.remove")}</Text>
              </Pressable>
            ) : null}
          </View>
        ))}
        <Pressable onPress={addChild} className="items-center rounded-xl border border-dashed border-mission-green py-3">
          <Text className="font-medium text-mission-green">{t("setup.addChild")}</Text>
        </Pressable>

        <Text className="mb-2 mt-6 text-base font-semibold text-mission-text dark:text-neutral-100">{t("setup.rewardsOptional")}</Text>
        {rewards.map((r, i) => (
          <View key={i} className="mb-3 rounded-2xl bg-white dark:bg-neutral-800 p-4">
            <TextInput
              value={r.name}
              onChangeText={(v) => updateReward(i, { name: v })}
              placeholder={t("setup.rewardNamePlaceholder")}
              className="mb-2 rounded-xl border border-gray-300 dark:border-neutral-700 px-3 py-2 text-mission-text dark:text-neutral-100"
            />
            <TextInput
              value={r.description}
              onChangeText={(v) => updateReward(i, { description: v })}
              placeholder={t("setup.rewardDescriptionPlaceholder")}
              className="mb-2 rounded-xl border border-gray-300 dark:border-neutral-700 px-3 py-2 text-mission-text dark:text-neutral-100"
            />
            <TextInput
              value={r.xpCost}
              onChangeText={(v) => updateReward(i, { xpCost: digitsOnly(v) })}
              placeholder={t("setup.xpCost")}
              keyboardType="number-pad"
              className="rounded-xl border border-gray-300 dark:border-neutral-700 px-3 py-2 text-mission-text dark:text-neutral-100"
            />
            {rewards.length > 1 ? (
              <Pressable onPress={() => removeReward(i)} className="mt-2 self-end">
                <Text className="text-sm text-red-600">{t("setup.remove")}</Text>
              </Pressable>
            ) : null}
          </View>
        ))}
        <Pressable onPress={addReward} className="items-center rounded-xl border border-dashed border-mission-purple py-3">
          <Text className="font-medium text-mission-purple">{t("setup.addReward")}</Text>
        </Pressable>

        {error ? <Text className="mt-4 text-sm text-red-600">{error}</Text> : null}

        <Pressable
          onPress={handleSubmit}
          disabled={submitting}
          className="mt-6 items-center justify-center rounded-xl bg-mission-green py-4 disabled:opacity-60"
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-base font-semibold text-white">{t("setup.submit")}</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
