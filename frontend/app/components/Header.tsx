"use client";

import Image from "next/image";
import Link from "next/link";
import { accountHome, logout } from "@/app/login/auth_service";
import { useSession } from "./SessionProvider";

export default function Header({
  contentId = "services",
}: {
  contentId?: string;
}) {
  const { user, checking, error, retry } = useSession();
  return (
    <header className="site-header">
      <a href={`#${contentId}`} className="skip-link">
        Pular para o conteúdo
      </a>
      <nav
        className="container py-3 d-flex flex-wrap align-items-center justify-content-between gap-3"
        aria-label="Navegação principal"
      >
        <Link
          className="brand d-inline-flex align-items-center"
          href="/"
          aria-label="Freelike, página inicial"
        >
          <Image
            src="/freelike-symbol.png"
            alt=""
            width={48}
            height={48}
            loading="eager"
          />
          <span>
            Freelike<span className="brand-dot">.</span>
          </span>
        </Link>
        <div className="account-links d-flex flex-wrap align-items-center justify-content-end gap-2">
          {checking ? (
            <span className="small text-secondary" role="status">
              Verificando sessão...
            </span>
          ) : error ? (
            <>
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={retry}
              >
                Verificar sessão
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={logout}
              >
                Sair
              </button>
            </>
          ) : user ? (
            <>
              {user.accountType === "FREELANCER" && (
                <Link
                  href="/admin/services"
                  className="btn btn-outline-primary"
                >
                  Meus serviços
                </Link>
              )}
              {user.accountType === "CLIENT" && (
                <Link
                  href="/client/interests"
                  className="btn btn-outline-primary"
                >
                  Meus interesses
                </Link>
              )}
              <Link
                href={accountHome(user.accountType)}
                className="btn btn-outline-primary"
              >
                Minha área
              </Link>
              <button
                type="button"
                className="btn btn-primary"
                onClick={logout}
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-outline-primary">
                Entrar
              </Link>
              <Link href="/register" className="btn btn-primary">
                Criar conta
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
