"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import { useState, type ReactNode } from "react";
import AccountSidebar from "./AccountSidebar";
import { useSession } from "./SessionProvider";

export default function AccountWorkspace({
  children,
}: {
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const { navigationAccountType } = useSession();
  const pathname = usePathname();
  const usesSidebar = navigationAccountType === "FREELANCER";
  const publicPage =
    pathname === "/" || pathname === "/explorar" || /^\/(services|freelancers)\//.test(pathname);
  const workspaceClass = collapsed
    ? "account-workspace is-collapsed"
    : "account-workspace";

  return (
    <div className={usesSidebar ? workspaceClass : undefined}>
      {usesSidebar && (
        <div className="workspace-sidebar-slot">
          <a href="#site-content" className="skip-link">
            Pular para o conteúdo
          </a>
          <AccountSidebar
            collapsed={collapsed}
            onToggle={() => setCollapsed((previous) => !previous)}
          />
        </div>
      )}
      <div id="site-content" className="workspace-content" tabIndex={-1}>
        {!usesSidebar && (publicPage || navigationAccountType === "CLIENT") && (
          <Header contentId="site-content" />
        )}
        {children}
      </div>
    </div>
  );
}
