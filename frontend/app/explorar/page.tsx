"use client";

import RefreshButton from "@/app/components/RefreshButton";

import { useEffect, useState } from "react";
import { loadPublicServices } from "@/app/components/service/public-services";
import ServiceCard from "@/app/components/service/ServiceCard";
import type { PublicService } from "@/app/types/service";

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

export default function ExplorePage() {
  const [services, setServices] = useState<PublicService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  const categories = [
    ...new Set(services.map((service) => service.category)),
  ].sort((left, right) => left.localeCompare(right, "pt-BR"));
  const query = normalizeSearch(search);
  const filteredServices = services.filter((service) => {
    if (category && service.category !== category) return false;
    const { freelancer } = service;
    return [
      service.title,
      service.category,
      freelancer.name,
      freelancer.profile?.fullName ?? "",
    ].some((value) => normalizeSearch(value).includes(query));
  });

  function clearFilters() {
    setSearch("");
    setCategory("");
  }

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 15000);

    async function loadServices() {
      try {
        const publishedServices = await loadPublicServices(controller.signal);
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
      <main
        id="services"
        className="container catalog-main flex-grow-1"
        tabIndex={-1}
      >
        <div className="catalog-intro mb-4 mb-md-5">
          <p className="section-label mb-2">SERVIÇOS</p>
          <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
            <h1 className="mb-0">Vitrine de serviços</h1>
          </div>
          <p className="text-secondary mb-0">
            Conheça os serviços, os preços iniciais e os profissionais.
          </p>
        </div>

        {!loading && !error && services.length > 0 && (
          <div
            className="catalog-search row g-3 align-items-end mb-4"
            role="search"
            aria-label="Buscar serviços"
          >
            <div className="col-12 col-md">
              <label
                className="form-label fw-semibold"
                htmlFor="catalog-search"
              >
                Que serviço você procura?
              </label>
              <div className="input-group">
                <span className="input-group-text" aria-hidden="true">
                  <i className="bi bi-search" />
                </span>
                <input
                  id="catalog-search"
                  type="search"
                  className="form-control"
                  placeholder="Título, categoria ou profissional"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            </div>
            <div className="col col-md-auto">
              <label
                className="form-label fw-semibold"
                htmlFor="catalog-category"
              >
                Categoria
              </label>
              <select
                id="catalog-category"
                className="form-select"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option value="">Todas as categorias</option>
                {categories.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-auto">
              <button
                type="button"
                className="btn workspace-refresh"
                onClick={clearFilters}
                disabled={!search && !category}
              >
                Limpar
              </button>
            </div>
          </div>
        )}

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
              <RefreshButton label="Atualizar vitrine" onClick={retry} />
            </div>
          ) : filteredServices.length === 0 ? (
            <p role="status" className="catalog-state">
              Nenhum serviço encontrado. Tente outro termo ou limpe os filtros.
            </p>
          ) : (
            <div className="row g-4">
              {filteredServices.map((service) => (
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
