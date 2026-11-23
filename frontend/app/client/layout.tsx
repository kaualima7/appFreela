import type { ReactNode } from "react";
import SessionGate from "@/app/components/SessionGate";

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <SessionGate access="CLIENT">
      <main className="workspace-main">{children}</main>
    </SessionGate>
  );
}
