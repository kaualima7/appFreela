"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import SessionGate from "@/app/components/SessionGate";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <SessionGate access="FREELANCER">
      <main className="workspace-main">
        {["/admin/users", "/admin/profiles"].includes(pathname) && (
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
