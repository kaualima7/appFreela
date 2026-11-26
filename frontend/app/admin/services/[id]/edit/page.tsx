"use client";
// Consulta o próprio anúncio pelo ID da URL e abre FormularioAnuncio para editá-lo.

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { API_URL, serviceError } from "@/app/api";
import { authenticatedFetch } from "@/app/login/auth_service";
import type { FreelancerService } from "@/app/types/service";
import FormularioAnuncio from "@/app/components/service/FormularioAnuncio";
export default function EditService() {
  const { id } = useParams<{ id: string }>();
  return <EditServiceContent key={id} id={id} />;
}
function EditServiceContent({ id }: { id: string }) {
  const router = useRouter();
  const [service, setService] = useState<FreelancerService | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    // Busca /api/services/mine/:id para preencher o formulário com os dados do próprio anúncio.
    async function load() {
      try {
        if (!/^[1-9]\d*$/.test(id) || Number(id) > 2147483647)
          throw new Error(
            "Serviço não encontrado ou indisponível para sua conta.",
          );
        const response = await authenticatedFetch(
          `${API_URL}/services/mine/${id}`,
          {
            signal: AbortSignal.any([
              controller.signal,
              AbortSignal.timeout(15000),
            ]),
          },
        );
        if (!response.ok)
          throw new Error(
            await serviceError(
              response,
              "Não foi possível carregar o serviço.",
            ),
          );
        const selected: FreelancerService = await response.json();
        if (active) setService(selected);
      } catch (error) {
        if (active)
          setError(
            error instanceof Error &&
              !(error instanceof TypeError) &&
              error.name !== "TimeoutError"
              ? error.message
              : "Não foi possível conectar. Tente novamente.",
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
  }, [id, revision]);
  return (
    <section className="service-form-page mx-auto">
      <div className="workspace-actions">
        <Link href="/admin/services" className="btn btn-outline-primary">
          <i className="bi bi-arrow-left" aria-hidden="true" />
          Voltar aos anúncios
        </Link>
      </div>
      <h1 className="h2 my-4">Editar serviço</h1>
      {loading ? (
        <p role="status">Carregando serviço...</p>
      ) : error ? (
        <div role="alert">
          <p>{error}</p>
          <button
            className="btn btn-outline-primary"
            onClick={() => {
              setError("");
              setLoading(true);
              setRevision((previous) => previous + 1);
            }}
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        service && (
          <div className="card card-body p-4">
            <FormularioAnuncio
              service={service}
              onClose={() => router.push("/admin/services")}
              onSaved={() => {
                sessionStorage.setItem(
                  "service-save-notice",
                  "Serviço atualizado.",
                );
                router.replace("/admin/services");
              }}
            />
          </div>
        )
      )}
    </section>
  );
}
