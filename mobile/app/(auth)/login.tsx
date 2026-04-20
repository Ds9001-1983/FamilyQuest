import { Link } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PinInput } from "@/components/pin-input";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { t } from "@/lib/i18n";

type Mode = "parent" | "child";

export default function LoginScreen() {
  const { login, childLogin, knownFamily, forgetFamily } = useAuth();
  const [mode, setMode] = useState<Mode>("parent");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const eligibleChildren = (knownFamily?.children ?? []).filter((c) => c.hasPin);
  const canChildLogin = eligibleChildren.length > 0;

  const handleParentSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("login.failed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleChildSubmit = async () => {
    if (!selectedChildId) return;
    setError(null);
    setSubmitting(true);
    try {
      await childLogin(selectedChildId, pin);
      setPin("");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("login.failed"));
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
          <Text className="mb-2 text-4xl font-bold text-white">LevelMission</Text>
          <Text className="mb-6 text-base text-white/70">{t("login.appTagline")}</Text>

          {knownFamily ? (
            <View className="mb-4 flex-row rounded-xl bg-white/10 p-1">
              <Pressable
                onPress={() => {
                  setMode("parent");
                  setError(null);
                }}
                className={`flex-1 items-center rounded-lg py-2 ${mode === "parent" ? "bg-white" : ""}`}
              >
                <Text className={`font-medium ${mode === "parent" ? "text-[#0b3d2e]" : "text-white"}`}>
                  {t("login.parentTab")}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setMode("child");
                  setError(null);
                }}
                disabled={!canChildLogin}
                className={`flex-1 items-center rounded-lg py-2 ${mode === "child" ? "bg-white" : ""} ${
                  !canChildLogin ? "opacity-40" : ""
                }`}
              >
                <Text className={`font-medium ${mode === "child" ? "text-[#0b3d2e]" : "text-white"}`}>
                  {t("login.childTab")}
                </Text>
              </Pressable>
            </View>
          ) : null}

          <View className="rounded-2xl bg-white p-6">
            {mode === "parent" ? (
              <>
                <Text className="mb-4 text-xl font-bold text-mission-text">{t("login.signIn")}</Text>

                <Text className="mb-1 text-sm font-medium text-mission-text">{t("app.email")}</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  placeholder={t("app.emailPlaceholder")}
                  className="mb-4 rounded-xl border border-gray-300 px-4 py-3 text-base text-mission-text"
                />

                <Text className="mb-1 text-sm font-medium text-mission-text">{t("app.password")}</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="password"
                  textContentType="password"
                  className="mb-4 rounded-xl border border-gray-300 px-4 py-3 text-base text-mission-text"
                />

                {error ? <Text className="mb-2 text-sm text-red-600">{error}</Text> : null}

                <Pressable
                  onPress={handleParentSubmit}
                  disabled={submitting || !email || !password}
                  className="mt-2 items-center justify-center rounded-xl bg-mission-green py-3 disabled:opacity-60"
                >
                  {submitting ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text className="text-base font-semibold text-white">{t("login.signIn")}</Text>
                  )}
                </Pressable>
              </>
            ) : (
              <>
                <Text className="mb-1 text-xl font-bold text-mission-text">{t("login.whoAreYou")}</Text>
                <Text className="mb-4 text-sm text-gray-600">{knownFamily?.familyName}</Text>

                <View className="mb-4 gap-2">
                  {eligibleChildren.map((c) => (
                    <Pressable
                      key={c.id}
                      onPress={() => setSelectedChildId(c.id)}
                      className={`rounded-xl border px-4 py-3 ${
                        selectedChildId === c.id
                          ? "border-mission-green bg-mission-green/10"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      <Text className="text-base font-medium text-mission-text">
                        {c.name ?? t("family.unknownChild")}
                        {c.age != null ? ` (${c.age})` : ""}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text className="mb-1 text-sm font-medium text-mission-text">{t("login.pin")}</Text>
                <PinInput
                  value={pin}
                  onChangeText={setPin}
                  className="mb-4 rounded-xl border border-gray-300 px-4 py-3 text-center text-xl tracking-widest text-mission-text"
                />

                {error ? <Text className="mb-2 text-sm text-red-600">{error}</Text> : null}

                <Pressable
                  onPress={handleChildSubmit}
                  disabled={submitting || !selectedChildId || pin.length < 4}
                  className="items-center justify-center rounded-xl bg-mission-green py-3 disabled:opacity-60"
                >
                  {submitting ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text className="text-base font-semibold text-white">{t("login.childGo")}</Text>
                  )}
                </Pressable>
              </>
            )}
          </View>

          {mode === "parent" ? (
            <View className="mt-6 flex-row justify-center">
              <Text className="text-white/70">{t("login.noAccount")}</Text>
              <Link href="/(auth)/register" className="font-semibold text-white">
                {t("login.register")}
              </Link>
            </View>
          ) : (
            <Pressable onPress={() => void forgetFamily()} className="mt-6 self-center">
              <Text className="text-sm text-white/60 underline">{t("login.resetDevice")}</Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
