"use client";

import { useId, useState, type FormEvent } from "react";
import { API_URL, managementError } from "@/app/api";
import { authenticatedFetch } from "@/app/login/auth_service";
import { useSession } from "./SessionProvider";

export default function ProfileNameForm({
  name,
  onSaved,
}: {
  name: string;
  onSaved: (name: string) => void;
}) {
  const { user, refreshUser } = useSession();
  const nameId = useId();
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || saving) return;

    const nextName = draftName.trim();
    if (nextName.length < 3 || nextName.length > 100) {
      setError("Informe um nome com 3 a 100 caracteres.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const response = await authenticatedFetch(
        `${API_URL.replace(/\/$/, "")}/users/${user.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: nextName }),
        },
      );
      if (!response.ok) {
        setError(await managementError(response));
        return;
      }
      const updatedUser: { name: string } = await response.json();
      onSaved(updatedUser.name);
      setEditing(false);
      setSaved(true);
      refreshUser();
    } catch {
      setError("Não foi possível salvar o nome. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div className="workspace-actions mt-3">
        <button
          type="button"
          className="btn btn-outline-primary"
          onClick={() => {
            setDraftName(name);
            setSaved(false);
            setError("");
            setEditing(true);
          }}
        >
          Editar nome
        </button>
        {saved && (
          <p className="small text-success mb-0 mt-2" role="status">
            Nome atualizado.
          </p>
        )}
      </div>
    );
  }

  return (
    <form className="workspace-actions mt-3" onSubmit={save} aria-busy={saving}>
      <label htmlFor={nameId} className="form-label">
        Nome
      </label>
      <input
        id={nameId}
        className="form-control mb-3"
        value={draftName}
        onChange={(event) => setDraftName(event.target.value)}
        minLength={3}
        maxLength={100}
        disabled={saving}
        required
        autoFocus
      />
      {error && <p className="text-danger" role="alert">{error}</p>}
      <div className="d-flex flex-wrap gap-2">
        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? "Salvando..." : "Salvar nome"}
        </button>
        <button
          type="button"
          className="btn btn-outline-primary"
          disabled={saving}
          onClick={() => setEditing(false)}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
