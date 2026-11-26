"use client";

// Controla quais páginas aparecem conforme a sessão e o tipo de conta.
// A API também verifica as permissões, em backend/src/auth/jwt-auth.guard.ts.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import {
  accountHome,
  logout,
  type AccountType,
} from "@/app/login/auth_service";
import { useSession } from "./SessionProvider";

export default function SessionGate({
  access,
  children,
}: {
  access: AccountType | "guest";
  children: ReactNode;
}) {
  const router = useRouter();
  const { user, checking, error, retry } = useSession();

  // Redireciona ao login se não houver sessão ou ao destino da conta se a área não for permitida.
  useEffect(() => {
    if (checking || error) return;
    if (user && (access === "guest" || user.accountType !== access))
      router.replace(accountHome(user.accountType));
    else if (!user && access !== "guest") router.replace("/login");
  }, [access, user, checking, error, router]);

  if (error)
    return (
      <main className="container session-state text-center">
        <div className="catalog-state">
          <h1 className="h4">Não foi possível confirmar seu acesso</h1>
          <p className="text-secondary" role="alert">
            {error}
          </p>
          <div className="d-flex flex-wrap justify-content-center gap-2">
            <button type="button" className="btn btn-primary" onClick={retry}>
              Tentar novamente
            </button>
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={logout}
            >
              Sair
            </button>
            <Link href="/explorar" className="btn btn-link">
              Voltar à vitrine
            </Link>
          </div>
        </div>
      </main>
    );
  if (
    checking ||
    (access === "guest" ? !!user : !user || user.accountType !== access)
  )
    return (
      <main className="container session-state text-center" role="status">
        <span className="spinner-border text-primary mb-3" aria-hidden="true" />
        <p className="text-secondary">Verificando sessão...</p>
      </main>
    );
  return children;
}
