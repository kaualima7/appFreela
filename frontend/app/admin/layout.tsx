"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Header from "@/app/components/Header";
import SessionGate from "@/app/components/SessionGate";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <SessionGate access="FREELANCER">
      <Header contentId="account-content" />
      <main id="account-content" className="container py-5" tabIndex={-1}>
        {pathname !== "/admin" && (
          <div className="alert alert-warning" role="note">
            Exemplo da aula. Esta tela ainda não foi adaptada ao fluxo do
            Freelike.
          </div>
        )}
        {children}
      </main>
    </SessionGate>
  );
}
