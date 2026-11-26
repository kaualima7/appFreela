"use client";

import { useEffect, useState, type FormEvent } from "react";
import { API_URL, managementError } from "@/app/api";
import { authenticatedFetch } from "@/app/login/auth_service";

const areasUrl = `${API_URL.replace(/\/$/, "")}/profiles/me`;

export default function FreelancerAreasForm({
  specialties,
  onSaved,
  onCancel,
}: {
  specialties: string[];
  onSaved: (specialties: string[]) => void;
  onCancel: () => void;
}) {
  const [options, setOptions] = useState<string[] | null>(null);
  const [selected, setSelected] = useState(specialties);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function loadOptions() {
      try {
        const response = await authenticatedFetch(
          `${areasUrl}/specialty-options`,
          {
            signal: AbortSignal.any([
              controller.signal,
              AbortSignal.timeout(15000),
            ]),
          },
        );
        if (!response.ok) throw new Error(await managementError(response));
        const available: string[] = await response.json();
        if (!controller.signal.aborted) setOptions(available);
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(
            error instanceof Error && error.name === "Error"
              ? error.message
              : "Não foi possível carregar as áreas de atuação.",
          );
        }
      }
    }
    void loadOptions();
    return () => controller.abort();
  }, [revision]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!options || saving) return;
    setSaving(true);
    setError("");
    try {
      const response = await authenticatedFetch(`${areasUrl}/specialties`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ specialties: selected }),
      });
      if (!response.ok) throw new Error(await managementError(response));
      const result: { specialties: string[] } = await response.json();
      onSaved(result.specialties);
    } catch (error) {
      setError(
        error instanceof Error && error.name === "Error"
          ? error.message
          : "Não foi possível salvar as áreas de atuação.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="mt-2" onSubmit={save} aria-busy={saving}>
      {error && (
        <p className="text-danger" role="alert">
          {error}
        </p>
      )}
      {options ? (
        <fieldset disabled={saving}>
          <legend className="small text-secondary mb-3">
            Escolha as áreas que você quer mostrar no seu perfil.
          </legend>
          <div className="row g-2 mb-3">
            {options.map((area) => (
              <div key={area} className="col-12 col-sm-6 col-lg-4">
                <label className="d-flex gap-2 align-items-baseline">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={selected.includes(area)}
                    onChange={(event) => {
                      const checked = event.currentTarget.checked;
                      setSelected((previous) =>
                        checked
                          ? [...previous, area]
                          : previous.filter((value) => value !== area),
                      );
                    }}
                  />
                  {area}
                </label>
              </div>
            ))}
          </div>
        </fieldset>
      ) : !error ? (
        <p role="status">Carregando opções...</p>
      ) : null}
      <div className="workspace-actions d-flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-outline-primary"
          onClick={onCancel}
          disabled={saving}
        >
          Cancelar
        </button>
        {options ? (
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Salvando..." : "Salvar áreas"}
          </button>
        ) : error ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setError("");
              setRevision((previous) => previous + 1);
            }}
          >
            Tentar novamente
          </button>
        ) : null}
      </div>
    </form>
  );
}
