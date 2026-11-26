"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import { createContext, useContext, useState, type ReactNode } from "react";
import AccountSidebar from "./AccountSidebar";
import { useSession } from "./SessionProvider";
import { readSidebarMode, type SidebarMode } from "@/app/preferences";

const SidebarSettingsContext = createContext<{
  sidebarMode: SidebarMode;
  changeSidebarMode: (mode: SidebarMode) => void;
} | null>(null);

export function useSidebarSettings() {
  const settings = useContext(SidebarSettingsContext);
  if (!settings) throw new Error("Preferências da barra lateral indisponíveis.");
  return settings;
}

export default function AccountWorkspace({
  children,
}: {
  children: ReactNode;
}) {
  const [sidebarMode, setSidebarMode] = useState(readSidebarMode);
  const [collapsed, setCollapsed] = useState(sidebarMode === "collapsed");
  const { navigationAccountType } = useSession();
  const pathname = usePathname();
  const usesSidebar = navigationAccountType === "FREELANCER";
  const publicPage =
    pathname === "/" || pathname === "/explorar" || /^\/(services|freelancers)\//.test(pathname);
  const workspaceClass = collapsed
    ? "account-workspace is-collapsed"
    : "account-workspace";

  function changeSidebarMode(mode: SidebarMode) {
    setSidebarMode(mode);
    setCollapsed(mode === "collapsed");
  }

  return (
    <div className={usesSidebar ? workspaceClass : undefined}>
      {usesSidebar && (
        <div className="workspace-sidebar-slot">
          <a href="#site-content" className="skip-link">
            Pular para o conteúdo
          </a>
          <AccountSidebar
            collapsed={collapsed}
            onToggle={
              sidebarMode === "fixed"
                ? undefined
                : () => setCollapsed((previous) => !previous)
            }
          />
        </div>
      )}
      <div id="site-content" className="workspace-content" tabIndex={-1}>
        {!usesSidebar && (publicPage || navigationAccountType === "CLIENT") && (
          <Header contentId="site-content" />
        )}
        <SidebarSettingsContext.Provider value={{ sidebarMode, changeSidebarMode }}>
          {children}
        </SidebarSettingsContext.Provider>
      </div>
    </div>
  );
}
