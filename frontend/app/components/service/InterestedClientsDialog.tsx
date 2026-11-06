"use client";

import { useEffect, useState } from "react";
import { API_URL, interestError } from "@/app/api";
import { authenticatedFetch } from "@/app/login/auth_service";
import type { FreelancerService, InterestedClient } from "@/app/types/service";
import ServiceDialog from "./ServiceDialog";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export default function InterestedClientsDialog({
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

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let active = true;
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
              "Não foi possível carregar os interessados. Tente novamente.",
            ),
          );
        const serviceInterests: InterestedClient[] | null = await response
          .json()
          .catch(() => null);
        if (!Array.isArray(serviceInterests))
          throw new Error("Não foi possível carregar os interessados.");
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

  return (
    <ServiceDialog
      id="interested-clients"
      title="Interessados no serviço"
      busy={false}
      onClose={onClose}
    >
      <p className="fw-semibold">{service.title}</p>
      {loading ? (
        <div className="text-center py-4" role="status">
          <span
            className="spinner-border text-primary mb-3"
            aria-hidden="true"
          />
          <p className="text-secondary mb-0">Carregando interessados...</p>
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
          Ainda não há interessados neste serviço.
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
    </ServiceDialog>
  );
}
