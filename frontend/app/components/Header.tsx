"use client";

// Monta o cabeçalho e os links de navegação conforme a sessão e o tipo de conta.

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { logout } from "@/app/login/auth_service";
import ProfileAvatar from "./ProfileAvatar";
import { useSession } from "./SessionProvider";

const clientLinks = [
  { href: "/explorar", label: "Explorar", icon: "compass" },
  { href: "/client/interests", label: "Meus likes", icon: "heart" },
  { href: "/client/projects", label: "Meus projetos", icon: "folder2-open" },
];

export default function Header({
  contentId = "services",
}: {
  contentId?: string;
}) {
  const { user, navigationAccountType, checking, error, retry } = useSession();
  const pathname = usePathname();
  const avatarMenu = useRef<HTMLDetailsElement>(null);
  const isClient = navigationAccountType === "CLIENT";

  function closeMenu() {
    if (avatarMenu.current) avatarMenu.current.open = false;
  }

  return (
    <header className="site-header">
      <a href={`#${contentId}`} className="skip-link">
        Pular para o conteúdo
      </a>
      <nav
        className={`container py-3 d-flex flex-wrap align-items-center justify-content-between gap-3${isClient ? " client-header" : ""}`}
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
        {isClient && (
          <div className="client-header-links d-flex flex-wrap gap-1">
            {clientLinks.map(({ href, label, icon }) => {
              const current = pathname === href;
              const active =
                current ||
                (href === "/explorar"
                  ? /^\/(services|freelancers)\//.test(pathname)
                  : pathname.startsWith(href + "/"));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`workspace-link${active ? " is-active" : ""}`}
                  aria-current={
                    current ? "page" : active ? "location" : undefined
                  }
                  onClick={closeMenu}
                >
                  <i className={`bi bi-${icon}`} aria-hidden="true" />
                  {label}
                </Link>
              );
            })}
          </div>
        )}
        <div className="account-links workspace-actions d-flex flex-wrap align-items-center justify-content-end gap-2">
          {isClient ? (
            <details
              ref={avatarMenu}
              className="client-avatar-menu"
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget))
                  closeMenu();
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape" && event.currentTarget.open) {
                  closeMenu();
                  event.currentTarget.querySelector("summary")?.focus();
                }
              }}
            >
              <summary aria-label="Menu da conta">
                <ProfileAvatar name={user?.name || "Cliente"} />
                <i className="bi bi-chevron-down" aria-hidden="true" />
              </summary>
              <div className="client-avatar-options">
                <Link
                  href="/client/profile"
                  className="workspace-link"
                  onClick={closeMenu}
                  aria-current={
                    pathname === "/client/profile" ? "page" : undefined
                  }
                >
                  <i className="bi bi-person-circle" aria-hidden="true" /> Meu
                  perfil
                </Link>
                <Link
                  href="/client/settings"
                  className={`workspace-link${pathname === "/client/settings" ? " is-active" : ""}`}
                  onClick={closeMenu}
                  aria-current={
                    pathname === "/client/settings" ? "page" : undefined
                  }
                >
                  <i className="bi bi-gear" aria-hidden="true" /> Configurações
                </Link>
                <button
                  type="button"
                  className="workspace-link w-100"
                  onClick={logout}
                >
                  <i className="bi bi-box-arrow-right" aria-hidden="true" />{" "}
                  Sair
                </button>
              </div>
            </details>
          ) : checking ? (
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
                className="btn workspace-refresh"
                onClick={logout}
              >
                <i className="bi bi-box-arrow-right" aria-hidden="true" />
                Sair
              </button>
            </>
          ) : (
            <>
              <Link
                href="/explorar"
                className={`workspace-link${pathname === "/explorar" ? " is-active" : ""}`}
                aria-current={pathname === "/explorar" ? "page" : undefined}
              >
                Explorar serviços
              </Link>
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
