"use client";

import Link from "next/link";
import { useSession } from "@/app/components/SessionProvider";

const sections = [
  {
    href: "/admin/services",
    icon: "megaphone",
    title: "Meus anúncios",
    description:
      "Publique o que você oferece na vitrine e gerencie seus rascunhos.",
  },
  {
    href: "/admin/projects",
    icon: "folder2-open",
    title: "Projetos",
    description:
      "Acompanhe os trabalhos combinados, com seus prazos e pagamentos.",
  },
  {
    href: "/admin/clients",
    icon: "people",
    title: "Contatos de clientes",
    description: "Organize as pessoas com quem você trabalha.",
  },
];

export default function Admin() {
  const { user } = useSession();
  if (!user) return null;

  return (
    <section aria-labelledby="workspace-title">
      <div className="workspace-welcome mb-4">
        <p className="section-label mb-2">Área do freelancer</p>
        <h1
          id="workspace-title"
          className="display-6 fw-semibold mb-0 text-break"
        >
          Olá, {user.name}.
        </h1>
      </div>
      <div className="row g-3">
        {sections.map((section) => (
          <div className="col-12 col-md-6 col-xl-4" key={section.href}>
            <Link href={section.href} className="workspace-shortcut">
              <i
                className={`workspace-shortcut-icon bi bi-${section.icon}`}
                aria-hidden="true"
              />
              <div className="d-flex align-items-center justify-content-between gap-2 mt-3 mb-2">
                <h2 className="h5 mb-0">{section.title}</h2>
                <i className="bi bi-arrow-right" aria-hidden="true" />
              </div>
              <p className="mb-0 text-secondary">{section.description}</p>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
