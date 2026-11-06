"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import {
  currentUser,
  SESSION_CHANGED,
  type SessionUser,
} from "@/app/login/auth_service";

const SessionContext = createContext<{
  user: SessionUser | null;
  checking: boolean;
  error: string;
  retry: () => void;
} | null>(null);

export default function SessionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [revision, setRevision] = useState(0);
  const [session, setSession] = useState<{
    path: string | null;
    revision: number;
    user: SessionUser | null;
    error: string;
  }>({ path: null, revision: -1, user: null, error: "" });

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 15000);

    async function verify() {
      try {
        const user = await currentUser(controller.signal);
        if (active) setSession({ path: pathname, revision, user, error: "" });
      } catch (error) {
        if (active)
          setSession({
            path: pathname,
            revision,
            user: null,
            error:
              error instanceof Error &&
              !(error instanceof TypeError) &&
              error.name !== "AbortError"
                ? error.message
                : "Não foi possível verificar sua sessão. Tente novamente.",
          });
      } finally {
        clearTimeout(timeout);
      }
    }
    void verify();
    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [pathname, revision]);

  useEffect(() => {
    function refresh() {
      setRevision((previousRevision) => previousRevision + 1);
    }
    function restore(event: PageTransitionEvent) {
      if (event.persisted) refresh();
    }
    window.addEventListener(SESSION_CHANGED, refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", restore);
    return () => {
      window.removeEventListener(SESSION_CHANGED, refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", restore);
    };
  }, []);

  const checking = session.path !== pathname || session.revision !== revision;
  return (
    <SessionContext.Provider
      value={{
        user: checking ? null : session.user,
        checking,
        error: checking ? "" : session.error,
        retry: () => setRevision((previousRevision) => previousRevision + 1),
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error("Sessão não inicializada.");
  return session;
}
