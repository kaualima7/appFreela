"use client";

// Lista quem deu like no anúncio do freelancer.
// A ação Adicionar como contato abre FormularioContato com os dados da conta selecionada.

import { useEffect, useState } from "react";
import { API_URL, interestError } from "@/app/api";
import { authenticatedFetch } from "@/app/login/auth_service";
import type { FreelancerService, InterestedClient } from "@/app/types/service";
import JanelaModal from "./JanelaModal";
import FormularioContato from "../FormularioContato";
import type { ClientAccount } from "@/app/types/management";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export default function JanelaInteressados({
  service,
  onClose,
}: {
  service: FreelancerService;
  onClose: () => void;
}) {
  const [interestedClients, setInterestedClients] = useState<
    InterestedClient[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestVersion, setRequestVersion] = useState(0);
  const [clientAccount, setClientAccount] = useState<ClientAccount | null>(
    null,
  );
  const [clientMessage, setClientMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let active = true;
    //interessados: GET /api/services/:id/interests busca quem deu like e preenche a janela do freelancer
    async function load() {
      try {
        const response = await authenticatedFetch(
          `${API_URL}/services/${service.id}/interests`,
          { signal: controller.signal },
        );
        if (!response.ok)
          throw new Error(
            await interestError(
              response,
              "Não foi possível carregar os likes. Tente novamente.",
            ),
          );
        const serviceInterests: InterestedClient[] | null = await response
          .json()
          .catch(() => null);
        if (!Array.isArray(serviceInterests))
          throw new Error("Não foi possível carregar os likes.");
        if (active) setInterestedClients(serviceInterests);
      } catch (error) {
        if (active)
          setError(
            error instanceof Error &&
              !(error instanceof TypeError) &&
              error.name !== "AbortError"
              ? error.message
              : "Não foi possível conectar. Verifique sua conexão e tente novamente.",
          );
      } finally {
        clearTimeout(timeout);
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [service.id, requestVersion]);

  //contato: Adicionar como contato seleciona clientAccount e abre FormularioContato com nome, e-mail e ID da conta
  if (clientAccount)
    return (
      <FormularioContato
        account={clientAccount}
        onClose={() => setClientAccount(null)}
        onSaved={(contact) => {
          setClientAccount(null);
          setClientMessage(`Contato salvo: ${contact.name}.`);
        }}
      />
    );
  return (
    <JanelaModal
      id="interested-clients"
      title="Quem deu like no serviço"
      busy={false}
      onClose={onClose}
    >
      <p className="fw-semibold">{service.title}</p>
      {clientMessage && (
        <p className="alert alert-success" role="status">
          {clientMessage}
        </p>
      )}
      {loading ? (
        <div className="text-center py-4" role="status">
          <span
            className="spinner-border text-primary mb-3"
            aria-hidden="true"
          />
          <p className="text-secondary mb-0">Carregando likes...</p>
        </div>
      ) : error ? (
        <div role="alert">
          <p className="text-danger">{error}</p>
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={() => {
              setLoading(true);
              setError("");
              setRequestVersion((previous) => previous + 1);
            }}
          >
            Tentar novamente
          </button>
        </div>
      ) : interestedClients.length === 0 ? (
        <p className="text-secondary" role="status">
          Este serviço ainda não recebeu likes.
        </p>
      ) : (
        <ul className="interested-clients list-unstyled mb-0">
          {interestedClients.map((interest) => (
            <li key={interest.id} className="py-3">
              <p className="fw-semibold mb-1">{interest.clientUser.name}</p>
              <a
                href={`mailto:${interest.clientUser.email}`}
                className="contact-email"
              >
                {interest.clientUser.email}
              </a>
              <p className="small text-secondary mt-2 mb-0">
                <time dateTime={interest.createdAt}>
                  {dateFormatter.format(new Date(interest.createdAt))}
                </time>
              </p>
              <button
                type="button"
                className="btn btn-outline-primary mt-2"
                onClick={() => {
                  setClientMessage("");
                  setClientAccount(interest.clientUser);
                }}
              >
                Adicionar como contato
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="d-flex justify-content-end dialog-actions mt-4">
        <button
          type="button"
          className="btn btn-outline-primary"
          onClick={onClose}
          data-dialog-focus
        >
          Fechar
        </button>
      </div>
    </JanelaModal>
  );
}
