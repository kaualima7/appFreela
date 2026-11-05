"use client";

import { useEffect, useState } from "react";
import { API_URL } from "./api";
import Header from "./components/Header";
import ServiceCard from "./components/service/ServiceCard";
import type { PublicService } from "./types/service";

export default function Home() {
  const [services, setServices] = useState<PublicService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 15000);

    async function loadServices() {
      try {
        const response = await fetch(`${API_URL.replace(/\/$/, "")}/services`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Falha ao consultar os serviços.");
        const publishedServices: PublicService[] = await response.json();
        if (!Array.isArray(publishedServices))
          throw new Error("Resposta inválida da API.");
        if (active) setServices(publishedServices);
      } catch {
        if (active) setError(true);
      } finally {
        clearTimeout(timeout);
        if (active) setLoading(false);
      }
    }

    void loadServices();
    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [requestVersion]);

  function retry() {
    setError(false);
    setLoading(true);
    setRequestVersion((currentVersion) => currentVersion + 1);
  }

  return (
    <>
      <Header />
      <main
        id="services"
        className="container catalog-main flex-grow-1"
        tabIndex={-1}
      >
        <div className="catalog-intro mb-4 mb-md-5">
          <p className="section-label mb-2">SERVIÇOS</p>
          <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
            <h1 className="mb-0">Vitrine de serviços</h1>
            {!loading && !error && services.length > 0 && (
              <span className="service-count">
                {services.length}{" "}
                {services.length === 1 ? "serviço" : "serviços"}
              </span>
            )}
          </div>
          <p className="text-secondary mb-0">
            Conheça os serviços, os preços iniciais e os profissionais.
          </p>
        </div>

        <section aria-label="Serviços publicados" aria-busy={loading}>
          {loading ? (
            <div className="catalog-state text-center" role="status">
              <span
                className="spinner-border text-primary mb-3"
                aria-hidden="true"
              />
              <p className="mb-0 text-secondary">Carregando serviços...</p>
            </div>
          ) : error ? (
            <div className="catalog-state text-center" role="alert">
              <span className="state-icon mb-3">
                <i className="bi bi-wifi-off" aria-hidden="true" />
              </span>
              <h2 className="h5">Não foi possível carregar a vitrine</h2>
              <p className="text-secondary mb-4">
                Verifique sua conexão e tente novamente.
              </p>
              <button type="button" className="btn btn-primary" onClick={retry}>
                Tentar novamente
              </button>
            </div>
          ) : services.length === 0 ? (
            <div className="catalog-state text-center" role="status">
              <span className="state-icon mb-3">
                <i className="bi bi-grid" aria-hidden="true" />
              </span>
              <h2 className="h5">Nenhum serviço publicado</h2>
              <p className="text-secondary mb-4">
                Os serviços aparecerão aqui quando forem publicados pelos
                freelancers.
              </p>
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={retry}
              >
                Atualizar vitrine
              </button>
            </div>
          ) : (
            <div className="row g-4">
              {services.map((service) => (
                <div key={service.id} className="col-12 col-md-6 col-lg-4">
                  <ServiceCard service={service} />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <footer className="site-footer">
        <div className="container d-flex flex-wrap justify-content-between gap-2 py-4">
          <span className="fw-semibold">Freelike</span>
          <span>Vitrine pública de serviços</span>
        </div>
      </footer>
    </>
  );
}
