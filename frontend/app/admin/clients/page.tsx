"use client";

import RefreshButton from "@/app/components/RefreshButton";
import { useEffect, useState } from "react";
import { API_URL, managementError } from "@/app/api";
import { authenticatedFetch } from "@/app/login/auth_service";
import type { ClientContact } from "@/app/types/management";
import FormularioContato from "@/app/components/FormularioContato";
import JanelaModal from "@/app/components/service/JanelaModal";

export default function Clients() {
  const [clients, setClients] = useState<ClientContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [editing, setEditing] = useState<ClientContact | null | undefined>(
    undefined,
  );
  const [success, setSuccess] = useState("");
  const [contactToDelete, setContactToDelete] = useState<ClientContact | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    async function load() {
      try {
        const response = await authenticatedFetch(`${API_URL}/clients`, {
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(15000),
          ]),
        });
        if (!response.ok) throw new Error(await managementError(response));
        const contacts: ClientContact[] = await response.json();
        if (active) setClients(contacts);
      } catch (error) {
        if (active)
          setError(
            error instanceof Error && !(error instanceof TypeError)
              ? error.message
              : "Não foi possível carregar os contatos.",
          );
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [revision]);
  function reload() {
    setLoading(true);
    setError("");
    setRevision((previous) => previous + 1);
  }
  async function deleteContact() {
    if (!contactToDelete || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const response = await authenticatedFetch(
        `${API_URL}/clients/${contactToDelete.id}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        setDeleteError(await managementError(response));
        return;
      }
      setContactToDelete(null);
      setSuccess("Contato excluído.");
      reload();
    } catch {
      setDeleteError("Não foi possível excluir o contato. Tente novamente.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section>
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h2 fw-semibold mb-2">Contatos de clientes</h1>
          <p className="text-secondary mb-0">
            Guarde os contatos de trabalho para vinculá-los aos seus projetos.
          </p>
        </div>
        <div className="workspace-actions d-flex flex-wrap gap-2">
          <RefreshButton
            label="Atualizar contatos"
            onClick={reload}
            loading={loading}
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setSuccess("");
              setEditing(null);
            }}
            data-dialog-return-focus
          >
            <i className="bi bi-plus-lg" aria-hidden="true" />
            Adicionar contato
          </button>
        </div>
      </div>
      {success && (
        <p role="status" className="alert alert-success">
          {success}
        </p>
      )}
      {loading ? (
        <p role="status">Carregando contatos...</p>
      ) : error ? (
        <div role="alert">
          <p>{error}</p>
          <button className="btn btn-primary" onClick={reload}>
            Tentar novamente
          </button>
        </div>
      ) : clients.length === 0 ? (
        <p role="status" className="text-secondary">
          Adicione um contato para organizar projetos de clientes que chegaram
          pelo Freelike ou por fora.
        </p>
      ) : (
        <div className="row g-3">
          {clients.map((client) => (
            <div className="col-12 col-md-6 col-lg-4" key={client.id}>
              <article className="card card-body h-100">
                <h2 className="h5">{client.name}</h2>
                <p className="text-break">
                  E-mail: {client.email || "Não informado"}
                  <br />
                  Telefone: {client.phone || "Não informado"}
                  <br />
                  Empresa: {client.company || "Não informada"}
                </p>
                <p>
                  {client.clientUserId != null
                    ? `Conta vinculada #${client.clientUserId}`
                    : "Sem conta vinculada"}
                </p>
                <div className="d-flex flex-wrap gap-2 mt-auto">
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    aria-label={`Editar ${client.name}`}
                    onClick={() => {
                      setSuccess("");
                      setEditing(client);
                    }}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    aria-label={`Excluir contato ${client.name}`}
                    onClick={() => {
                      setSuccess("");
                      setDeleteError("");
                      setContactToDelete(client);
                    }}
                  >
                    Excluir contato
                  </button>
                </div>
              </article>
            </div>
          ))}
        </div>
      )}
      {contactToDelete && (
        <JanelaModal
          id="delete-contact"
          title="Excluir contato"
          busy={deleting}
          onClose={() => setContactToDelete(null)}
        >
          <p>
            Excluir <strong>{contactToDelete.name}</strong> da sua agenda?
          </p>
          {deleteError && (
            <p className="alert alert-danger" role="alert">
              {deleteError}
            </p>
          )}
          <div className="d-flex flex-wrap justify-content-end gap-2 dialog-actions">
            <button
              type="button"
              className="btn btn-outline-primary"
              disabled={deleting}
              onClick={() => setContactToDelete(null)}
              data-dialog-focus
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-danger"
              disabled={deleting}
              onClick={deleteContact}
            >
              {deleting ? "Excluindo..." : "Excluir contato"}
            </button>
          </div>
        </JanelaModal>
      )}
      {editing !== undefined && (
        <FormularioContato
          client={editing ?? undefined}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            setSuccess("Contato salvo.");
            reload();
          }}
        />
      )}
    </section>
  );
}
