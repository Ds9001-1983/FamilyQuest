import * as SecureStore from "expo-secure-store";
import { config } from "./config";

const API_URL: string = config.apiUrl;

const ACCESS_KEY = "lm.accessToken";
const REFRESH_KEY = "lm.refreshToken";
const FAMILY_KEY = "lm.lastFamily";

export type KnownFamily = {
  familyId: number;
  familyName: string;
  email: string;
  children: { id: number; name: string | null; age: number | null; hasPin: boolean }[];
};

export const tokenStorage = {
  async getAccess() {
    return SecureStore.getItemAsync(ACCESS_KEY);
  },
  async getRefresh() {
    return SecureStore.getItemAsync(REFRESH_KEY);
  },
  async set(access: string, refresh: string) {
    await SecureStore.setItemAsync(ACCESS_KEY, access);
    await SecureStore.setItemAsync(REFRESH_KEY, refresh);
  },
  async clear() {
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  },
};

export const familyStorage = {
  async get(): Promise<KnownFamily | null> {
    const raw = await SecureStore.getItemAsync(FAMILY_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as KnownFamily;
    } catch {
      return null;
    }
  },
  async set(family: KnownFamily) {
    await SecureStore.setItemAsync(FAMILY_KEY, JSON.stringify(family));
  },
  async clear() {
    await SecureStore.deleteItemAsync(FAMILY_KEY);
  },
};

type ApiOptions = Omit<RequestInit, "body"> & { auth?: boolean; body?: unknown };

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const refreshToken = await tokenStorage.getRefresh();
    if (!refreshToken) return null;
    try {
      const res = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) {
        await tokenStorage.clear();
        return null;
      }
      const data = (await res.json()) as { accessToken: string; refreshToken: string };
      await tokenStorage.set(data.accessToken, data.refreshToken);
      return data.accessToken;
    } catch {
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function api<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const { auth = true, headers, body, ...rest } = options;

  const doFetch = async (accessToken: string | null): Promise<Response> => {
    const finalHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...(headers as Record<string, string> | undefined),
    };
    if (auth && accessToken) finalHeaders["Authorization"] = `Bearer ${accessToken}`;

    const serializedBody: BodyInit | null | undefined =
      body == null
        ? (body as null | undefined)
        : typeof body === "string"
          ? body
          : JSON.stringify(body);

    return fetch(`${API_URL}${path}`, {
      ...rest,
      headers: finalHeaders,
      body: serializedBody,
    });
  };

  let token = auth ? await tokenStorage.getAccess() : null;
  let res = await doFetch(token);

  if (auth && res.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      res = await doFetch(refreshed);
    }
  }

  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const errBody = (await res.json()) as { message?: string };
      if (errBody?.message) message = errBody.message;
    } catch {
      // ignore
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export { API_URL };
