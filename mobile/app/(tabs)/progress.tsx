import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { t } from "@/lib/i18n";

type Reward = {
  id: number;
  name: string;
  requiredXP: number;
};

type Mission = {
  id: number;
  completed: boolean;
  assignedToUserId: number | null;
  xpReward: number;
};

type Member = {
  id: number;
  name: string | null;
  age: number | null;
  isParent: boolean;
  totalXP: number;
};

type Me = {
  id: number;
  name: string | null;
  totalXP: number;
  isParent: boolean;
};

function ProgressBar({ current, target, colorClass }: { current: number; target: number; colorClass: string }) {
  const pct = target <= 0 ? 100 : Math.min(100, Math.round((current / target) * 100));
  return (
    <View className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-neutral-700">
      <View className={`h-full ${colorClass}`} style={{ width: `${pct}%` }} />
    </View>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <View className="flex-1 rounded-2xl bg-white dark:bg-neutral-800 p-4">
      <Text className="text-xs uppercase text-gray-400 dark:text-neutral-500">{label}</Text>
      <Text className="mt-1 text-2xl font-bold text-mission-text dark:text-neutral-100">{value}</Text>
    </View>
  );
}

export default function ProgressScreen() {
  const { user } = useAuth();
  const isParent = user?.role === "parent";

  const meQuery = useQuery({
    queryKey: ["me-user"],
    queryFn: () => api<Me>("/api/user"),
    enabled: !isParent,
  });

  const membersQuery = useQuery({
    queryKey: ["family-members"],
    queryFn: () => api<Member[]>("/api/family/members"),
    enabled: isParent,
  });

  const missionsQuery = useQuery({
    queryKey: ["missions"],
    queryFn: () => api<Mission[]>("/api/missions"),
  });

  const completedQuery = useQuery({
    queryKey: ["missions-completed"],
    queryFn: () => api<Mission[]>("/api/missions/completed"),
  });

  const rewardsQuery = useQuery({
    queryKey: ["rewards"],
    queryFn: () => api<Reward[]>("/api/rewards"),
  });

  const loading =
    missionsQuery.isLoading ||
    completedQuery.isLoading ||
    rewardsQuery.isLoading ||
    (isParent ? membersQuery.isLoading : meQuery.isLoading);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50 dark:bg-neutral-900">
        <ActivityIndicator size="large" color="#059669" />
      </SafeAreaView>
    );
  }

  const rewards = rewardsQuery.data ?? [];

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-neutral-900">
      <View className="border-b border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 px-4 pb-3 pt-2">
        <Text className="text-2xl font-bold text-mission-text dark:text-neutral-100">{t("progress.title")}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {isParent ? (
          <>
            <Text className="text-base font-semibold text-mission-text dark:text-neutral-100">{t("progress.yourChildren")}</Text>
            {(membersQuery.data ?? [])
              .filter((m) => !m.isParent)
              .map((child) => {
                const nextReward = rewards
                  .filter((r) => r.requiredXP > child.totalXP)
                  .sort((a, b) => a.requiredXP - b.requiredXP)[0];
                return (
                  <View key={child.id} className="rounded-2xl bg-white dark:bg-neutral-800 p-4">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-base font-semibold text-mission-text dark:text-neutral-100">
                        {child.name ?? t("family.unknownChild")}
                        {child.age != null ? ` (${child.age})` : ""}
                      </Text>
                      <Text className="text-lg font-bold text-mission-green">{child.totalXP} XP</Text>
                    </View>
                    {nextReward ? (
                      <>
                        <Text className="mt-3 text-xs text-gray-500 dark:text-neutral-400">
                          {`${t("progress.nextReward")}: ${nextReward.name} (${child.totalXP}/${nextReward.requiredXP} XP)`}
                        </Text>
                        <ProgressBar
                          current={child.totalXP}
                          target={nextReward.requiredXP}
                          colorClass="bg-mission-purple"
                        />
                      </>
                    ) : rewards.length > 0 ? (
                      <Text className="mt-2 text-xs text-gray-500 dark:text-neutral-400">{t("progress.allRewardsReached")}</Text>
                    ) : null}
                  </View>
                );
              })}
          </>
        ) : (
          <>
            <View className="items-center rounded-2xl bg-mission-green p-6">
              <Text className="text-sm text-white/80">{t("progress.yourPoints")}</Text>
              <Text className="mt-1 text-5xl font-bold text-white">{meQuery.data?.totalXP ?? 0}</Text>
              <Text className="mt-1 text-sm text-white/80">{t("progress.xpEarned")}</Text>
            </View>

            <View className="flex-row gap-3">
              <StatCard
                label={t("progress.open")}
                value={(missionsQuery.data ?? []).filter((m) => !m.completed).length}
              />
              <StatCard label={t("progress.done")} value={(completedQuery.data ?? []).length} />
            </View>

            {rewards.length > 0 ? (
              <View>
                <Text className="mb-2 text-base font-semibold text-mission-text dark:text-neutral-100">{t("tabs.rewards")}</Text>
                {rewards
                  .slice()
                  .sort((a, b) => a.requiredXP - b.requiredXP)
                  .map((r) => {
                    const myXP = meQuery.data?.totalXP ?? 0;
                    const unlocked = myXP >= r.requiredXP;
                    return (
                      <View key={r.id} className="mb-3 rounded-2xl bg-white dark:bg-neutral-800 p-4">
                        <View className="flex-row items-center justify-between">
                          <Text className="flex-1 text-base font-semibold text-mission-text dark:text-neutral-100">
                            {r.name}
                          </Text>
                          <Text
                            className={`text-sm font-bold ${
                              unlocked ? "text-mission-green" : "text-mission-purple"
                            }`}
                          >
                            {unlocked ? t("progress.unlocked") : `${myXP}/${r.requiredXP} XP`}
                          </Text>
                        </View>
                        {!unlocked ? (
                          <ProgressBar
                            current={myXP}
                            target={r.requiredXP}
                            colorClass="bg-mission-purple"
                          />
                        ) : null}
                      </View>
                    );
                  })}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
