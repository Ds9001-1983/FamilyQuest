import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, familyStorage, tokenStorage, type KnownFamily } from "./api";
import { clearDevicePushRegistration, registerDeviceForPush } from "./push";

export type AuthRole = "parent" | "child";

export type AuthUser = {
  id: number; // family id
  userId: number; // user id (parent or child)
  familyName: string;
  email: string;
  isSetupComplete: boolean;
  role: AuthRole;
  name: string | null;
};

type FamilyMember = {
  id: number;
  name: string | null;
  age: number | null;
  isParent: boolean;
  hasPin: boolean;
};

type TokenLoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

type AuthState = {
  user: AuthUser | null;
  ready: boolean;
  knownFamily: KnownFamily | null;
};

type AuthContextValue = AuthState & {
  login: (email: string, password: string) => Promise<void>;
  childLogin: (userId: number, pin: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    familyName: string;
    parentName?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  forgetFamily: () => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  refresh: () => Promise<void>;
  refreshKnownFamily: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function cacheFamilyFromParent(user: AuthUser): Promise<KnownFamily> {
  const members = await api<FamilyMember[]>("/api/family/members");
  const knownFamily: KnownFamily = {
    familyId: user.id,
    familyName: user.familyName,
    email: user.email,
    children: members
      .filter((m) => !m.isParent)
      .map((m) => ({ id: m.id, name: m.name, age: m.age, hasPin: m.hasPin })),
  };
  await familyStorage.set(knownFamily);
  return knownFamily;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, ready: false, knownFamily: null });

  const loadMe = useCallback(async () => {
    const knownFamily = await familyStorage.get();
    const token = await tokenStorage.getAccess();
    if (!token) {
      setState({ user: null, ready: true, knownFamily });
      return;
    }
    try {
      const user = await api<AuthUser>("/api/auth/me");
      setState({ user, ready: true, knownFamily });
    } catch {
      await tokenStorage.clear();
      setState({ user: null, ready: true, knownFamily });
    }
  }, []);

  useEffect(() => {
    void loadMe();
  }, [loadMe]);

  useEffect(() => {
    if (state.user) {
      void registerDeviceForPush();
    }
  }, [state.user]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<TokenLoginResponse>("/api/auth/token", {
      auth: false,
      method: "POST",
      body: { email, password },
    });
    await tokenStorage.set(res.accessToken, res.refreshToken);
    let knownFamily: KnownFamily | null = null;
    try {
      knownFamily = await cacheFamilyFromParent(res.user);
    } catch {
      // If the family is not set up yet, member-listing can fail; fall back gracefully.
      knownFamily = { familyId: res.user.id, familyName: res.user.familyName, email: res.user.email, children: [] };
      await familyStorage.set(knownFamily);
    }
    setState({ user: res.user, ready: true, knownFamily });
  }, []);

  const childLogin = useCallback(async (userId: number, pin: string) => {
    const known = await familyStorage.get();
    if (!known) {
      throw new Error("Familie ist auf diesem Gerät noch nicht eingerichtet");
    }
    const res = await api<TokenLoginResponse>("/api/auth/child/token", {
      auth: false,
      method: "POST",
      body: { familyId: known.familyId, userId, pin },
    });
    await tokenStorage.set(res.accessToken, res.refreshToken);
    setState({ user: res.user, ready: true, knownFamily: known });
  }, []);

  const register = useCallback(
    async (data: { email: string; password: string; familyName: string; parentName?: string }) => {
      const res = await api<AuthUser & { accessToken: string; refreshToken: string }>(
        "/api/auth/register",
        {
          auth: false,
          method: "POST",
          body: data,
        },
      );
      await tokenStorage.set(res.accessToken, res.refreshToken);
      const { accessToken: _a, refreshToken: _r, ...user } = res;
      const knownFamily: KnownFamily = {
        familyId: user.id,
        familyName: user.familyName,
        email: user.email,
        children: [],
      };
      await familyStorage.set(knownFamily);
      setState({ user, ready: true, knownFamily });
    },
    [],
  );

  const logout = useCallback(async () => {
    // Unregister the push token while the access token is still valid.
    await clearDevicePushRegistration();
    await tokenStorage.clear();
    // Keep knownFamily so the child can still sign in with their PIN on this device.
    const knownFamily = await familyStorage.get();
    setState({ user: null, ready: true, knownFamily });
  }, []);

  const forgetFamily = useCallback(async () => {
    await clearDevicePushRegistration();
    await tokenStorage.clear();
    await familyStorage.clear();
    setState({ user: null, ready: true, knownFamily: null });
  }, []);

  const deleteAccount = useCallback(async (password: string) => {
    await api("/api/auth/delete-account", {
      method: "POST",
      body: { password },
    });
    await tokenStorage.clear();
    await familyStorage.clear();
    setState({ user: null, ready: true, knownFamily: null });
  }, []);

  const refreshKnownFamily = useCallback(async () => {
    if (!state.user || state.user.role !== "parent") return;
    try {
      const knownFamily = await cacheFamilyFromParent(state.user);
      setState((s) => ({ ...s, knownFamily }));
    } catch {
      // ignore
    }
  }, [state.user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      childLogin,
      register,
      logout,
      forgetFamily,
      deleteAccount,
      refresh: loadMe,
      refreshKnownFamily,
    }),
    [state, login, childLogin, register, logout, forgetFamily, deleteAccount, loadMe, refreshKnownFamily],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
