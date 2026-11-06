import type { ReactNode } from "react";
import Header from "@/app/components/Header";
import SessionGate from "@/app/components/SessionGate";

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <SessionGate access="CLIENT">
      <Header contentId="account-content" />
      <main id="account-content" className="container py-5" tabIndex={-1}>
        {children}
      </main>
    </SessionGate>
  );
}
