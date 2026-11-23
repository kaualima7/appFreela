"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PublicService } from "@/app/types/service";
import { money } from "@/app/types/management";
import { loadPublicServices } from "./public-services";

export default function HomeServiceHighlight() {
  const [service, setService] = useState<PublicService>();

  useEffect(() => {
    const controller = new AbortController();
    const signal = AbortSignal.any([
      controller.signal,
      AbortSignal.timeout(15000),
    ]);

    void loadPublicServices(signal)
      .then((services) => {
        if (!signal.aborted) {
          setService(services.find(({ imageUrl }) => imageUrl?.trim()));
        }
      })
      .catch(() => {
        // A apresentação da home funciona sem um serviço em destaque.
      });

    return () => controller.abort();
  }, []);

  if (!service) return null;
  const { freelancer, id, startingPrice, title } = service;

  return (
    <Link href={`/services/${id}`} className="home-service-highlight">
      <div className="min-w-0">
        <strong className="d-block">{title}</strong>
        <span className="text-secondary small">
          {freelancer.profile?.fullName || freelancer.name}
        </span>
        <span className="home-service-price d-block mt-1">
          A partir de <strong>{money(startingPrice)}</strong>
        </span>
      </div>
      <i className="bi bi-arrow-up-right" aria-hidden="true" />
    </Link>
  );
}