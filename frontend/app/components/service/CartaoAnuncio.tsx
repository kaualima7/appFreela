"use client";

import type { PublicService } from "@/app/types/service";
import ImagemAnuncio from "./ImagemAnuncio";
import Link from "next/link";
import type { ReactNode } from "react";

const priceFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function CartaoAnuncio({
  service,
  unavailable = false,
  children,
}: {
  service: PublicService;
  unavailable?: boolean;
  children?: ReactNode;
}) {
  const professionalName =
    service.freelancer.profile?.fullName || service.freelancer.name;

  return (
    <article
      className={`card service-card${service.imageUrl ? " h-100" : " service-card-compact"}`}
    >
      {service.imageUrl && (
        <ImagemAnuncio title={service.title} imageUrl={service.imageUrl} />
      )}
      <div className="card-body d-flex flex-column p-4">
        <span className="service-category align-self-start mb-3">
          {service.category}
        </span>
        {unavailable && (
          <span className="service-status draft align-self-start mb-3">
            Serviço indisponível
          </span>
        )}
        <h2 className="service-title h5">{service.title}</h2>
        <p className="service-description text-secondary mb-4">
          {service.description}
        </p>
        <div className="mt-auto">
          <div className="d-flex align-items-center gap-2 mb-3">
            <span className="professional-initial" aria-hidden="true">
              {professionalName.trim().charAt(0).toUpperCase()}
            </span>
            <span className="professional-name">{professionalName}</span>
          </div>
          <div className="service-price pt-3 d-flex flex-wrap justify-content-between align-items-baseline gap-2">
            <span className="small text-secondary">A partir de</span>
            <strong>
              {priceFormatter.format(Number(service.startingPrice))}
            </strong>
          </div>
          {!unavailable && (
            <Link
              href={`/services/${service.id}`}
              className="btn btn-outline-primary w-100 mt-3"
            >
              Ver serviço
            </Link>
          )}
          {children}
        </div>
      </div>
    </article>
  );
}
