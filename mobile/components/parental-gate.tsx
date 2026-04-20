import { useMemo, useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { digitsOnly } from "@/lib/text";
import { t } from "@/lib/i18n";

/**
 * Parental-Gate-Challenge — Apple Kids category requires parent-only actions
 * (external links, account deletion, in-app purchases, settings) to be guarded
 * by a challenge that a child could not plausibly solve. A random arithmetic
 * problem is the standard, inexpensive way to implement this.
 */

type Props = {
  visible: boolean;
  onPass: () => void;
  onCancel: () => void;
  title?: string;
};

function generateChallenge() {
  // Two-operand math with two- or three-digit numbers; no negative results.
  const a = 20 + Math.floor(Math.random() * 80);
  const b = 10 + Math.floor(Math.random() * 40);
  return { a, b, answer: a + b };
}

export function ParentalGate({ visible, onPass, onCancel, title }: Props) {
  const challenge = useMemo(() => (visible ? generateChallenge() : null), [visible]);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  const check = () => {
    if (!challenge) return;
    if (parseInt(input, 10) === challenge.answer) {
      setInput("");
      setError(false);
      onPass();
    } else {
      setError(true);
    }
  };

  if (!challenge) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View className="flex-1 items-center justify-center bg-black/40 px-6">
        <SafeAreaView className="w-full max-w-sm">
          <View className="rounded-2xl bg-white dark:bg-neutral-800 p-6">
            <Text className="mb-1 text-lg font-bold text-mission-text dark:text-neutral-100">
              {title ?? t("profile.parentalGateTitleAdult")}
            </Text>
            <Text className="mb-4 text-sm text-gray-600 dark:text-neutral-300">
              {t("parentalGate.prompt")}
            </Text>

            <Text className="mb-2 text-center text-3xl font-bold text-mission-text dark:text-neutral-100">
              {challenge.a} + {challenge.b} = ?
            </Text>

            <TextInput
              value={input}
              onChangeText={(v) => {
                setInput(digitsOnly(v));
                setError(false);
              }}
              keyboardType="number-pad"
              autoFocus
              className="mb-2 rounded-xl border border-gray-300 dark:border-neutral-700 px-4 py-3 text-center text-lg text-mission-text dark:text-neutral-100"
            />
            {error ? (
              <Text className="mb-2 text-center text-sm text-red-600">
                {t("parentalGate.wrong")}
              </Text>
            ) : null}

            <View className="mt-2 flex-row gap-2">
              <Pressable
                onPress={() => {
                  setInput("");
                  setError(false);
                  onCancel();
                }}
                className="flex-1 items-center rounded-xl border border-gray-300 dark:border-neutral-700 py-3"
              >
                <Text className="font-medium text-mission-text dark:text-neutral-100">{t("app.cancel")}</Text>
              </Pressable>
              <Pressable
                onPress={check}
                disabled={!input}
                className="flex-1 items-center rounded-xl bg-mission-green py-3 disabled:opacity-60"
              >
                <Text className="font-semibold text-white">{t("app.confirm")}</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
