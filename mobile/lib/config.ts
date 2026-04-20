import Constants from "expo-constants";

type Extra = {
  apiUrl?: string;
  privacyUrl?: string;
  termsUrl?: string;
  supportEmail?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

export const config = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? extra.apiUrl ?? "http://localhost:5000",
  privacyUrl: process.env.EXPO_PUBLIC_PRIVACY_URL ?? extra.privacyUrl ?? "https://levelmission.app/privacy",
  termsUrl: process.env.EXPO_PUBLIC_TERMS_URL ?? extra.termsUrl ?? "https://levelmission.app/terms",
  supportEmail: extra.supportEmail ?? "support@levelmission.app",
};
