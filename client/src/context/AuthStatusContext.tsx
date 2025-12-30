import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getAuthStatus, spotifyApiJson } from "@/lib/spotifyApi";

type SpotifyUser = {
  id: string;
  display_name?: string | null;
};

type AuthStatusContextValue = {
  authenticated: boolean;
  checked: boolean;
  profile: SpotifyUser | null;
  refresh: (opts?: { forceProfile?: boolean }) => Promise<boolean>;
};

const AuthStatusContext = createContext<AuthStatusContextValue | undefined>(
  undefined
);

export function AuthStatusProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [checked, setChecked] = useState(false);
  const [profile, setProfile] = useState<SpotifyUser | null>(null);
  const reqIdRef = useRef(0);

  const refresh = useCallback(async (opts?: { forceProfile?: boolean }) => {
    const myReqId = ++reqIdRef.current;
    try {
      let status: Awaited<ReturnType<typeof getAuthStatus>> | null = null;
      try {
        status = await getAuthStatus();
      } catch {
        status = null;
      }

      if (!status) {
        setAuthenticated(false);
        setProfile(null);
        return false;
      }

      const authed = Boolean(status.authenticated);
      if (reqIdRef.current === myReqId) {
        setAuthenticated(authed);
        if (!authed) setProfile(null);
      }

      if (authed && (opts?.forceProfile || !profile)) {
        try {
          const data = await spotifyApiJson<SpotifyUser>("/api/me");
          if (reqIdRef.current === myReqId) {
            setProfile(data ?? null);
          }
        } catch {
          if (reqIdRef.current === myReqId) {
            setProfile(null);
          }
        }
      }
      return authed;
    } finally {
      if (reqIdRef.current === myReqId) {
        setChecked(true);
      }
    }
  }, [profile]);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  useEffect(() => {
    const onFocus = () => refresh().catch(() => {});
    const onVis = () => {
      if (document.visibilityState === "visible") {
        refresh().catch(() => {});
      }
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [refresh]);

  useEffect(() => {
    const id = window.setInterval(() => {
      refresh().catch(() => {});
    }, 30_000);
    return () => window.clearInterval(id);
  }, [refresh]);

  const value = useMemo(
    () => ({ authenticated, checked, profile, refresh }),
    [authenticated, checked, profile, refresh]
  );

  return (
    <AuthStatusContext.Provider value={value}>
      {children}
    </AuthStatusContext.Provider>
  );
}

export function useAuthStatus() {
  const ctx = useContext(AuthStatusContext);
  if (!ctx) {
    throw new Error("useAuthStatus must be used within AuthStatusProvider");
  }
  return ctx;
}
