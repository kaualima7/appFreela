"use client";

import { useState } from "react";
import {
  sidebarStorageKey,
  textSizeStorageKey,
  themeStorageKey,
  type SidebarMode,
  type TextSize,
} from "@/app/preferences";
import { useSidebarSettings } from "./AccountWorkspace";
import { useSession } from "./SessionProvider";

export default function AccountSettings() {
  const { user } = useSession();
  const { sidebarMode, changeSidebarMode } = useSidebarSettings();
  const [dark, setDark] = useState(
    () =>
      typeof document !== "undefined" &&
      document.documentElement.dataset.bsTheme === "dark",
  );
  const [textSize, setTextSize] = useState<TextSize>(() => {
    if (typeof document === "undefined") return "standard";
    const size = document.documentElement.dataset.textSize;
    return size === "medium" || size === "large" ? size : "standard";
  });
  const [saveError, setSaveError] = useState(false);

  function savePreference(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
      setSaveError(false);
    } catch {
      setSaveError(true);
    }
  }

  function changeTheme(darkMode: boolean) {
    const theme = darkMode ? "dark" : "light";
    document.documentElement.dataset.bsTheme = theme;
    setDark(darkMode);
    savePreference(themeStorageKey, theme);
  }

  function changeTextSize(size: TextSize) {
    document.documentElement.dataset.textSize = size;
    setTextSize(size);
    savePreference(textSizeStorageKey, size);
  }

  return (
    <section className="account-home">
      <h1 className="h2 mb-4">Configurações</h1>
      <section className="card card-body p-4" aria-labelledby="appearance-heading">
        <h2 id="appearance-heading" className="h5 mb-3">
          Aparência
        </h2>
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <label className="fw-semibold d-block" htmlFor="dark-mode">
              <i className="bi bi-moon-stars me-2" aria-hidden="true" />
              Modo escuro
            </label>
            <p id="theme-description" className="text-secondary small mb-0 mt-1">
              Use cores escuras nas páginas do Freelike.
            </p>
          </div>
          <div className="form-check form-switch m-0">
            <input
              className="form-check-input theme-switch"
              type="checkbox"
              role="switch"
              id="dark-mode"
              aria-describedby="theme-description"
              checked={dark}
              onChange={(event) => changeTheme(event.currentTarget.checked)}
            />
          </div>
        </div>
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 border-top pt-3 mt-3">
          <label className="fw-semibold" htmlFor="text-size">
            <i className="bi bi-fonts me-2" aria-hidden="true" />
            Tamanho do texto
          </label>
          <select
            id="text-size"
            className="form-select w-auto mw-100"
            value={textSize}
            onChange={(event) => changeTextSize(event.currentTarget.value as TextSize)}
          >
            <option value="standard">Padrão</option>
            <option value="medium">Um pouco maior</option>
            <option value="large">Maior</option>
          </select>
        </div>
        <p className="text-secondary small mb-0 mt-3">
          As preferências são salvas neste navegador.
        </p>
      </section>
      {user?.accountType === "FREELANCER" && (
        <section className="card card-body p-4 mt-3" aria-labelledby="sidebar-heading">
          <h2 id="sidebar-heading" className="h5 mb-3">
            Barra lateral
          </h2>
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <label className="fw-semibold" htmlFor="sidebar-mode">
              <i className="bi bi-layout-sidebar-inset me-2" aria-hidden="true" />
              Comportamento
            </label>
            <select
              id="sidebar-mode"
              className="form-select w-auto mw-100"
              aria-describedby="sidebar-description"
              value={sidebarMode}
              onChange={(event) => {
                const mode = event.currentTarget.value as SidebarMode;
                changeSidebarMode(mode);
                savePreference(sidebarStorageKey, mode);
              }}
            >
              <option value="manual">Recolher quando quiser</option>
              <option value="fixed">Sempre aberta</option>
              <option value="collapsed">Começar recolhida</option>
            </select>
          </div>
          <p id="sidebar-description" className="text-secondary small mb-0 mt-3">
            Esta preferência se aplica em telas largas.
          </p>
        </section>
      )}
      {saveError && (
        <p className="text-warning small mb-0 mt-3" role="status">
          A preferência foi aplicada, mas o navegador não permitiu salvá-la.
        </p>
      )}
    </section>
  );
}
