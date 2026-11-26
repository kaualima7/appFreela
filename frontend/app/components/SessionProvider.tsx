"use client";

// Consulta a conta autenticada e compartilha os dados da sessão entre os componentes.
// Refaz a consulta ao navegar ou quando a sessão muda.

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
  navigationAccountType: SessionUser["accountType"] | null;
  checking: boolean;
  error: string;
  retry: () => void;
  refreshUser: () => void;
} | null>(null);

export default function SessionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [revision, setRevision] = useState(0);
  const [backgroundRevision, setBackgroundRevision] = useState(0);
  const [session, setSession] = useState<{
    path: string | null;
    revision: number;
    user: SessionUser | null;
    error: string;
  }>({ path: null, revision: -1, user: null, error: "" });

  // Confere a sessão na API ao abrir ou mudar de página; a limpeza cancela a consulta ao sair.
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 15000);

    // Consulta currentUser em login/auth_service.ts e compartilha a conta encontrada com as telas.
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
  }, [pathname, revision, backgroundRevision]);

  useEffect(() => {
    function refresh() {
      setRevision((previousRevision) => previousRevision + 1);
    }
    function checkOnFocus() {
      // Voltar do seletor de arquivos não deve desmontar uma tela já autorizada.
      setBackgroundRevision((previousRevision) => previousRevision + 1);
    }
    function restore(event: PageTransitionEvent) {
      if (event.persisted) refresh();
    }
    window.addEventListener(SESSION_CHANGED, refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", checkOnFocus);
    window.addEventListener("pageshow", restore);
    return () => {
      window.removeEventListener(SESSION_CHANGED, refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", checkOnFocus);
      window.removeEventListener("pageshow", restore);
    };
  }, []);

  const checking = session.path !== pathname || session.revision !== revision;
  return (
    <SessionContext.Provider
      value={{
        user: checking ? null : session.user,
        navigationAccountType:
          session.revision === revision
            ? (session.user?.accountType ?? null)
            : null,
        checking,
        error: checking ? "" : session.error,
        retry: () => setRevision((previousRevision) => previousRevision + 1),
        refreshUser: () =>
          setBackgroundRevision((previousRevision) => previousRevision + 1),
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

// Permite que os componentes consultem a conta e o estado da verificação de sessão.
export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error("Sessão não inicializada.");
  return session;
}
