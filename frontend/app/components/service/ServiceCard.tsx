"use client";

import Image from "next/image";
import { useState } from "react";
import type { PublicService } from "@/app/types/service";

const priceFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function ServiceCard({ service }: { service: PublicService }) {
  const [imageFailed, setImageFailed] = useState(false);
  const professionalName =
    service.freelancer.profile?.fullName || service.freelancer.name;

  return (
    <article className="card service-card h-100">
      <div className="service-image">
        {service.imageUrl && !imageFailed ? (
          <Image
            src={service.imageUrl}
            alt={service.title}
            width={720}
            height={450}
            className="service-photo"
            unoptimized
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="image-placeholder">
            <i className="bi bi-image" aria-hidden="true" />
            <span>Serviço sem imagem</span>
          </div>
        )}
      </div>
      <div className="card-body d-flex flex-column p-4">
        <span className="service-category align-self-start mb-3">
          {service.category}
        </span>
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
        </div>
      </div>
    </article>
  );
}
