// Mostra um anúncio do freelancer com as ações de editar, excluir e consultar interessados.

import type { FreelancerService } from "@/app/types/service";
import Link from "next/link";
import ImagemAnuncio from "./ImagemAnuncio";

const priceFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function CartaoMeuAnuncio({
  service,
  onDelete,
  onViewInterests,
}: {
  service: FreelancerService;
  onDelete: (service: FreelancerService) => void;
  onViewInterests: (service: FreelancerService) => void;
}) {
  return (
    <article className="card service-card h-100">
      <ImagemAnuncio title={service.title} imageUrl={service.imageUrl} />
      <div className="card-body d-flex flex-column p-4">
        <div className="d-flex flex-wrap align-items-start gap-2 mb-3">
          <span className="service-category">{service.category}</span>
          <span
            className={`service-status ${service.published ? "published" : "draft"}`}
          >
            {service.published ? "Publicado" : "Rascunho"}
          </span>
        </div>
        <h2 className="service-title h5 mb-4">{service.title}</h2>
        <div className="mt-auto">
          <div className="service-price d-flex flex-wrap align-items-baseline justify-content-between gap-2 py-3">
            <span className="small text-secondary">A partir de</span>
            <strong>
              {priceFormatter.format(Number(service.startingPrice))}
            </strong>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <Link
              href={`/admin/services/${service.id}/edit`}
              className="btn btn-outline-primary flex-grow-1"
              aria-label={`Editar ${service.title}`}
            >
              Editar
            </Link>
            <button
              type="button"
              className="btn btn-outline-danger"
              aria-label={`Excluir ${service.title}`}
              onClick={() => onDelete(service)}
            >
              Excluir
            </button>
          </div>
          <button
            type="button"
            className="btn btn-outline-primary w-100 mt-2"
            aria-label={`Ver quem deu like em ${service.title}`}
            onClick={() => onViewInterests(service)}
          >
            Ver quem deu like
          </button>
        </div>
      </div>
    </article>
  );
}
