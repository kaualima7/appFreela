"use client";
// Lê o ID da URL, consulta o anúncio público e mostra seus detalhes.
// BotaoInteresse cuida do like; o link do profissional abre seu perfil.

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { API_URL } from "@/app/api";
import ProfileAvatar from "@/app/components/ProfileAvatar";
import ImagemAnuncio from "@/app/components/service/ImagemAnuncio";
import BotaoInteresse from "@/app/components/service/BotaoInteresse";
import { useInterests } from "@/app/components/InterestsProvider";
import { useSession } from "@/app/components/SessionProvider";
import type { PublicService } from "@/app/types/service";
import { money } from "@/app/types/management";
export default function ServiceDetails() {
  const { id } = useParams<{ id: string }>();
  return <ServiceDetailsContent key={id} id={id} />;
}
function ServiceDetailsContent({ id }: { id: string }) {
  const [service, setService] = useState<PublicService | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const { user } = useSession();
  const { error: interestsError, reload } = useInterests();
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    // Consulta GET /api/services/:id, que devolve apenas anúncios publicados.
    async function load() {
      try {
        if (!/^[1-9]\d*$/.test(id) || Number(id) > 2147483647)
          throw new Error("Serviço não encontrado ou indisponível.");
        const response = await fetch(`${API_URL}/services/${id}`, {
          cache: "no-store",
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(15000),
          ]),
        });
        if (response.status === 404)
          throw new Error("Serviço não encontrado ou indisponível.");
        if (!response.ok)
          throw new Error(
            "Não foi possível carregar o serviço. Tente novamente.",
          );
        const selected: PublicService = await response.json();
        if (active) setService(selected);
      } catch (error) {
        if (active)
          setError(
            error instanceof Error &&
              !(error instanceof TypeError) &&
              error.name !== "TimeoutError"
              ? error.message
              : "Não foi possível conectar. Verifique sua conexão e tente novamente.",
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
  const professionalName =
    service?.freelancer.profile?.fullName || service?.freelancer.name || "";
  const avatar = service?.freelancer.profile?.avatarUrl;
  return (
    <>
      <main id="service-details" className="container py-5" tabIndex={-1}>
        <div className="workspace-actions">
          <Link href="/explorar" className="btn workspace-refresh">
            <i className="bi bi-arrow-left" aria-hidden="true" />
            Voltar à vitrine
          </Link>
        </div>
        {loading ? (
          <p role="status" className="mt-4">
            Carregando serviço...
          </p>
        ) : error ? (
          <div role="alert" className="catalog-state mt-4">
            <h1 className="h4">Serviço indisponível</h1>
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
            <div className="row g-4 mt-2">
              <div className="col-12 col-lg-8">
                <article className="card overflow-hidden service-details-main">
                  <ImagemAnuncio
                    title={service.title}
                    imageUrl={service.imageUrl}
                  />
                  <div className="card-body p-4">
                    <span className="service-category">{service.category}</span>
                    <h1 className="h2 mt-3">{service.title}</h1>
                    <p className="mb-0 service-full-description">
                      {service.description}
                    </p>
                  </div>
                </article>
              </div>
              <aside
                className="col-12 col-lg-4"
                aria-label="Profissional e like no anúncio"
              >
                <div className="card card-body p-4">
                  <p className="small text-secondary mb-1">A partir de</p>
                  <p className="h3 mb-4">{money(service.startingPrice)}</p>
                  <div className="d-flex gap-3 align-items-center">
                    <ProfileAvatar name={professionalName} avatarUrl={avatar} />
                    <div>
                      <p className="fw-semibold text-break mb-1">
                        {professionalName}
                      </p>
                      <Link href={`/freelancers/${service.freelancer.id}`}>
                        Ver perfil
                      </Link>
                    </div>
                  </div>
                  <BotaoInteresse service={service} />
                  {user?.accountType === "CLIENT" && interestsError && (
                    <div className="alert alert-warning mt-3" role="alert">
                      <p>{interestsError}</p>
                      <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={reload}
                      >
                        Tentar carregar likes novamente
                      </button>
                    </div>
                  )}
                  <p className="small text-secondary mt-3 mb-0">
                    Dê um like para mostrar ao freelancer que você tem interesse neste serviço.
                  </p>
                </div>
              </aside>
            </div>
          )
        )}
      </main>
    </>
  );
}
