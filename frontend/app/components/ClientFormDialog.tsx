"use client";
import { useRef, useState, type FormEvent } from "react";
import { API_URL, managementError } from "../api";
import { authenticatedFetch } from "../login/auth_service";
import type { ClientAccount, ClientContact } from "../types/management";
import ServiceDialog from "./service/ServiceDialog";

export default function ClientFormDialog({
  client,
  account,
  onClose,
  onSaved,
}: {
  client?: ClientContact;
  account?: ClientAccount;
  onClose: () => void;
  onSaved: (client: ClientContact) => void;
}) {
  const [name, setName] = useState(client?.name ?? account?.name ?? "");
  const [email, setEmail] = useState(client?.email ?? account?.email ?? "");
  const [phone, setPhone] = useState(client?.phone ?? "");
  const [company, setCompany] = useState(client?.company ?? "");
  const [notes, setNotes] = useState(client?.notes ?? "");
  const [unlink, setUnlink] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  const [error, setError] = useState("");
  const [existing, setExisting] = useState<ClientContact | null>(null);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving.current) return;
    if (name.trim().length < 2) {
      setError("Informe um nome com pelo menos dois caracteres.");
      return;
    }
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      if (account && !client) {
        const response = await authenticatedFetch(`${API_URL}/clients`);
        if (!response.ok) throw new Error(await managementError(response));
        const contacts: ClientContact[] = await response.json();
        const registered = contacts.find(
          (contact) => contact.clientUserId === account.id,
        );
        if (registered) {
          setExisting(registered);
          return;
        }
      }
      const response = await authenticatedFetch(
        `${API_URL}/clients${client ? `/${client.id}` : ""}`,
        {
          method: client ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim() || null,
            phone: phone.trim() || null,
            company: company.trim() || null,
            notes: notes.trim() || null,
            ...(client
              ? unlink
                ? { clientUserId: null }
                : {}
              : account
                ? { clientUserId: account.id }
                : {}),
          }),
        },
      );
      if (!response.ok) throw new Error(await managementError(response));
      onSaved(await response.json());
    } catch (error) {
      setError(
        error instanceof Error && !(error instanceof TypeError)
          ? error.message
          : "Não foi possível salvar. Verifique sua conexão e tente novamente.",
      );
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  return (
    <ServiceDialog
      id="client-form"
      title={client ? "Editar cliente" : "Novo cliente"}
      busy={busy}
      onClose={onClose}
    >
      <form onSubmit={save}>
        <fieldset disabled={busy || !!existing}>
          <label className="form-label" htmlFor="client-name">
            Nome
          </label>
          <input
            id="client-name"
            className="form-control mb-3"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            minLength={2}
            maxLength={120}
            data-dialog-focus
          />
          <label className="form-label" htmlFor="client-email">
            E-mail (opcional)
          </label>
          <input
            id="client-email"
            type="email"
            className="form-control mb-3"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <label className="form-label" htmlFor="client-phone">
            Telefone (opcional)
          </label>
          <input
            id="client-phone"
            type="tel"
            className="form-control mb-3"
            maxLength={30}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
          <label className="form-label" htmlFor="client-company">
            Empresa (opcional)
          </label>
          <input
            id="client-company"
            className="form-control mb-3"
            maxLength={120}
            value={company}
            onChange={(event) => setCompany(event.target.value)}
          />
          <label className="form-label" htmlFor="client-notes">
            Notas internas (opcional)
          </label>
          <textarea
            id="client-notes"
            className="form-control mb-3"
            maxLength={2000}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
          {client?.clientUserId != null && (
            <div className="alert alert-info">
              <p>
                Conta vinculada: #{client.clientUserId}
                {account?.id === client.clientUserId
                  ? ` — ${account.name} (${account.email})`
                  : ""}
              </p>
              <label>
                <input
                  type="checkbox"
                  checked={unlink}
                  onChange={(event) => {
                    setUnlink(event.target.checked);
                    setConfirmed(false);
                  }}
                />{" "}
                Desvincular conta
              </label>
            </div>
          )}
          {((account && !client) || unlink) && (
            <div className="alert alert-warning">
              {unlink ? (
                <p>
                  A conta perderá acesso aos projetos e pagamentos deste
                  contato.
                </p>
              ) : (
                <>
                  <p>
                    {account?.name} — {account?.email}
                  </p>
                  <p>
                    Esta conta poderá consultar todos os projetos e pagamentos
                    deste contato, inclusive os anteriores.
                  </p>
                </>
              )}
              <label>
                <input
                  type="checkbox"
                  required
                  checked={confirmed}
                  onChange={(event) => setConfirmed(event.target.checked)}
                />{" "}
                {unlink
                  ? "Confirmo a desvinculação ao salvar."
                  : "Confirmo o vínculo com esta conta."}
              </label>
            </div>
          )}
          <div className="d-flex gap-2 justify-content-end">
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button className="btn btn-primary" type="submit">
              {busy ? "Salvando..." : "Salvar cliente"}
            </button>
          </div>
        </fieldset>
        {error && (
          <p role="alert" className="alert alert-danger mt-3">
            {error}
          </p>
        )}
        {existing && (
          <div role="status" className="alert alert-info mt-3">
            <p>Esta conta já está cadastrada no contato {existing.name}.</p>
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={() => onSaved(existing)}
            >
              Concluir
            </button>
          </div>
        )}
      </form>
    </ServiceDialog>
  );
}
