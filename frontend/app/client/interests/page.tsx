"use client";

import Link from "next/link";
import { useInterests } from "@/app/components/InterestsProvider";
import ServiceCard from "@/app/components/service/ServiceCard";

export default function MyInterests() {
  const { interests, loading, error, reload } = useInterests();
  return (
    <section aria-labelledby="my-interests-title" aria-busy={loading}>
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
        <div>
          <p className="section-label mb-2">ÁREA DO CLIENTE</p>
          <h1 id="my-interests-title" className="h2 fw-bold mb-2">
            Meus interesses
          </h1>
          <p className="text-secondary mb-0">Serviços em que você deu like.</p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={reload}
            disabled={loading}
          >
            Atualizar
          </button>
          <Link href="/" className="btn btn-primary">
            Ver vitrine
          </Link>
        </div>
      </div>
      {loading ? (
        <div className="catalog-state text-center" role="status">
          <span
            className="spinner-border text-primary mb-3"
            aria-hidden="true"
          />
          <p className="text-secondary mb-0">Carregando seus interesses...</p>
        </div>
      ) : error ? (
        <div className="catalog-state text-center" role="alert">
          <h2 className="h5">Não foi possível carregar seus interesses</h2>
          <p className="text-secondary">{error}</p>
          <button type="button" className="btn btn-primary" onClick={reload}>
            Tentar novamente
          </button>
        </div>
      ) : interests.length === 0 ? (
        <div className="catalog-state text-center" role="status">
          <span className="state-icon mb-3">
            <i className="bi bi-heart" aria-hidden="true" />
          </span>
          <h2 className="h5">Você ainda não tem interesses</h2>
          <p className="text-secondary mb-3">
            Explore a vitrine e dê like nos serviços que interessam a você.
          </p>
          <Link href="/" className="btn btn-outline-primary">
            Explorar serviços
          </Link>
        </div>
      ) : (
        <div className="row g-4">
          {interests.map((interest) => (
            <div key={interest.id} className="col-12 col-md-6 col-lg-4">
              <ServiceCard
                service={interest.service}
                unavailable={!interest.service.published}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
