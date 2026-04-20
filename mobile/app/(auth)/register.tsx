import { Link } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { t } from "@/lib/i18n";

export default function RegisterScreen() {
  const { register } = useAuth();
  const [familyName, setFamilyName] = useState("");
  const [parentName, setParentName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adultConfirmed, setAdultConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    familyName.trim() && email.trim() && password.length >= 8 && adultConfirmed;

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await register({
        familyName: familyName.trim(),
        parentName: parentName.trim() || undefined,
        email: email.trim(),
        password,
      });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("register.failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0b3d2e]">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="flex-1 justify-center px-6">
          <Text className="mb-2 text-3xl font-bold text-white">{t("register.title")}</Text>
          <Text className="mb-6 text-base text-white/70">{t("register.subtitle")}</Text>

          <View className="rounded-2xl bg-white p-6">
            <Text className="mb-1 text-sm font-medium text-mission-text">{t("register.familyName")}</Text>
            <TextInput
              value={familyName}
              onChangeText={setFamilyName}
              placeholder={t("register.familyNamePlaceholder")}
              className="mb-3 rounded-xl border border-gray-300 px-4 py-3 text-base text-mission-text"
            />

            <Text className="mb-1 text-sm font-medium text-mission-text">{t("register.parentName")}</Text>
            <TextInput
              value={parentName}
              onChangeText={setParentName}
              placeholder={t("register.parentNamePlaceholder")}
              className="mb-3 rounded-xl border border-gray-300 px-4 py-3 text-base text-mission-text"
            />

            <Text className="mb-1 text-sm font-medium text-mission-text">{t("app.email")}</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              placeholder={t("app.emailPlaceholder")}
              className="mb-3 rounded-xl border border-gray-300 px-4 py-3 text-base text-mission-text"
            />

            <Text className="mb-1 text-sm font-medium text-mission-text">
              {t("register.passwordLabel")}
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              className="mb-4 rounded-xl border border-gray-300 px-4 py-3 text-base text-mission-text"
            />

            <Pressable
              onPress={() => setAdultConfirmed((v) => !v)}
              className="mb-2 flex-row items-start gap-3"
            >
              <View
                className={`mt-0.5 h-5 w-5 items-center justify-center rounded border ${
                  adultConfirmed ? "border-mission-green bg-mission-green" : "border-gray-400"
                }`}
              >
                {adultConfirmed ? <Text className="text-xs font-bold text-white">✓</Text> : null}
              </View>
              <Text className="flex-1 text-sm text-gray-700">
                {t("register.adultConfirm")}
              </Text>
            </Pressable>

            {error ? <Text className="mb-2 text-sm text-red-600">{error}</Text> : null}

            <Pressable
              onPress={handleSubmit}
              disabled={submitting || !canSubmit}
              className="mt-2 items-center justify-center rounded-xl bg-mission-green py-3 disabled:opacity-60"
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-base font-semibold text-white">{t("register.submit")}</Text>
              )}
            </Pressable>
          </View>

          <View className="mt-6 flex-row justify-center">
            <Text className="text-white/70">{t("register.haveAccount")}</Text>
            <Link href="/(auth)/login" className="font-semibold text-white">
              {t("login.signIn")}
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
