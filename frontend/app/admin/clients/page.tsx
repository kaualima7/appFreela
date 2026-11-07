"use client";
import { useEffect, useState } from "react";
import { API_URL, managementError } from "@/app/api";
import { authenticatedFetch } from "@/app/login/auth_service";
import type { ClientContact } from "@/app/types/management";
import ClientFormDialog from "@/app/components/ClientFormDialog";
export default function Clients() {
  const [clients, setClients] = useState<ClientContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [editing, setEditing] = useState<ClientContact | null | undefined>(
    undefined,
  );
  const [success, setSuccess] = useState("");
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
              : "Não foi possível carregar os clientes.",
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
  return (
    <section>
      <div className="d-flex flex-wrap justify-content-between gap-3 mb-4">
        <h1>Clientes</h1>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-primary"
            onClick={reload}
            disabled={loading}
          >
            Atualizar
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setSuccess("");
              setEditing(null);
            }}
            data-dialog-return-focus
          >
            Novo cliente
          </button>
        </div>
      </div>
      {success && (
        <p role="status" className="alert alert-success">
          {success}
        </p>
      )}
      {loading ? (
        <p role="status">Carregando clientes...</p>
      ) : error ? (
        <div role="alert">
          <p>{error}</p>
          <button className="btn btn-primary" onClick={reload}>
            Tentar novamente
          </button>
        </div>
      ) : clients.length === 0 ? (
        <p>Nenhum cliente cadastrado.</p>
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
                <button
                  className="btn btn-outline-primary mt-auto"
                  aria-label={`Editar ${client.name}`}
                  onClick={() => {
                    setSuccess("");
                    setEditing(client);
                  }}
                >
                  Editar
                </button>
              </article>
            </div>
          ))}
        </div>
      )}
      {editing !== undefined && (
        <ClientFormDialog
          client={editing ?? undefined}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            setSuccess("Cliente salvo.");
            reload();
          }}
        />
      )}
    </section>
  );
}
