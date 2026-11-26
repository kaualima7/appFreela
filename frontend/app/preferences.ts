export const themeStorageKey = "freelike-theme";
export const textSizeStorageKey = "freelike-text-size";
export const sidebarStorageKey = "freelike-sidebar-mode";

export type TextSize = "standard" | "medium" | "large";
export type SidebarMode = "fixed" | "manual" | "collapsed";

export function readSidebarMode(): SidebarMode {
  if (typeof window === "undefined") return "manual";
  try {
    const mode = window.localStorage.getItem(sidebarStorageKey);
    if (mode === "fixed" || mode === "collapsed") return mode;
  } catch {}
  return "manual";
}
