"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { logout } from "@/app/login/auth_service";

const freelancerNavigation = [
  ["/admin", "Área do freelancer", "grid-1x2"],
  ["/admin/services", "Meus anúncios", "megaphone"],
  ["/admin/projects", "Projetos", "folder2-open"],
  ["/admin/clients", "Contatos de clientes", "people"],
  ["/admin/profile", "Meu perfil", "person-circle"],
];

export default function AccountSidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  const home = "/admin";
  const browsingCatalog =
    pathname === "/explorar" || /^\/(services|freelancers)\//.test(pathname);
  return (
    <aside
      className="workspace-sidebar"
      onKeyDown={(event) => {
        if (
          event.key === "Escape" &&
          open &&
          menuButton.current?.getClientRects().length
        ) {
          setOpen(false);
          menuButton.current.focus();
        }
      }}
    >
      <div className="workspace-top">
        <Link
          href={home}
          className="brand d-inline-flex align-items-center"
          onClick={() => setOpen(false)}
          aria-label="Freelike, início da área do freelancer"
        >
          <Image src="/freelike-symbol.png" alt="" width={38} height={38} />
          <span className="workspace-label">
            Freelike<span className="brand-dot">.</span>
          </span>
        </Link>
        <button
          type="button"
          className="btn workspace-refresh workspace-collapse-toggle"
          onClick={onToggle}
          aria-label={
            collapsed ? "Expandir barra lateral" : "Recolher barra lateral"
          }
          title={
            collapsed ? "Expandir barra lateral" : "Recolher barra lateral"
          }
          aria-controls="account-menu"
          aria-expanded={!collapsed}
        >
          <i
            className={
              collapsed ? "bi bi-chevron-bar-right" : "bi bi-chevron-bar-left"
            }
            aria-hidden="true"
          />
        </button>
        <button
          ref={menuButton}
          type="button"
          className="btn btn-outline-primary workspace-menu-toggle"
          aria-expanded={open}
          aria-controls="account-menu"
          onClick={() => setOpen(!open)}
        >
          <i
            className={open ? "bi bi-x-lg" : "bi bi-list"}
            aria-hidden="true"
          />{" "}
          Menu
        </button>
      </div>
      <div
        id="account-menu"
        className={open ? "workspace-menu is-open" : "workspace-menu"}
      >
        <nav className="workspace-links" aria-label="Navegação do freelancer">
          {freelancerNavigation.map(([href, label, icon]) => {
            const current = pathname === href;
            const active =
              current || (href !== home && pathname.startsWith(href + "/"));
            return (
              <Link
                key={href}
                href={href}
                className={
                  active ? "workspace-link is-active" : "workspace-link"
                }
                aria-current={
                  current ? "page" : active ? "location" : undefined
                }
                onClick={() => setOpen(false)}
                title={collapsed ? label : undefined}
              >
                <i className={`bi bi-${icon}`} aria-hidden="true" />
                <span className="workspace-label">{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="workspace-links workspace-utilities">
          <Link
            href="/explorar"
            className={
              browsingCatalog ? "workspace-link is-active" : "workspace-link"
            }
            onClick={() => setOpen(false)}
            aria-current={
              pathname === "/explorar"
                ? "page"
                : browsingCatalog
                  ? "location"
                  : undefined
            }
            title={collapsed ? "Vitrine" : undefined}
          >
            <i className="bi bi-shop" aria-hidden="true" />
            <span className="workspace-label">Vitrine</span>
          </Link>
          <button
            type="button"
            className="workspace-link"
            onClick={logout}
            title={collapsed ? "Sair" : undefined}
          >
            <i className="bi bi-box-arrow-right" aria-hidden="true" />
            <span className="workspace-label">Sair</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
