"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/app/api";
import ProfileAvatar from "@/app/components/ProfileAvatar";
import ServiceCard from "@/app/components/service/ServiceCard";
import type { PublicFreelancer } from "@/app/types/service";

export default function FreelancerProfile({ id }: { id: string }) {
  const validId = /^[1-9]\d*$/.test(id) && Number(id) <= 2147483647;
  const [profile, setProfile] = useState<PublicFreelancer | null>(null);
  const [status, setStatus] = useState<
    "loading" | "ready" | "missing" | "error"
  >(validId ? "loading" : "missing");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!validId) return;
    const controller = new AbortController();
    let active = true;
    async function loadProfile() {
      try {
        const response = await fetch(
          `${API_URL.replace(/\/$/, "")}/freelancers/${id}`,
          {
            cache: "no-store",
            signal: AbortSignal.any([
              controller.signal,
              AbortSignal.timeout(15000),
            ]),
          },
        );
        if (response.status === 404) {
          if (active) setStatus("missing");
          return;
        }
        if (!response.ok) throw new Error();
        const result: PublicFreelancer = await response.json();
        if (active) {
          setProfile(result);
          setStatus("ready");
        }
      } catch {
        if (active) setStatus("error");
      }
    }
    void loadProfile();
    return () => {
      active = false;
      controller.abort();
    };
  }, [id, revision, validId]);

  const name = profile?.profile?.fullName?.trim() || profile?.name || "";
  const categories = [
    ...new Set(profile?.services.map((service) => service.category) ?? []),
  ];

  return (
    <>
      {status === "loading" && (
        <p className="mt-4" role="status">
          Carregando perfil...
        </p>
      )}
      {status === "missing" && <h1 className="h3 mt-4">Perfil indisponível</h1>}
      {status === "error" && (
        <div className="alert alert-warning mt-4" role="alert">
          <p>Não foi possível carregar o perfil.</p>
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={() => {
              setStatus("loading");
              setRevision((value) => value + 1);
            }}
          >
            Tentar novamente
          </button>
        </div>
      )}
      {status === "ready" && profile && (
        <>
          <section className="card card-body p-4 my-4">
            <div className="d-flex align-items-center gap-3">
              <ProfileAvatar
                name={name}
                avatarUrl={profile.profile?.avatarUrl}
              />
              <h1 className="h2 mb-0 text-break">{name}</h1>
            </div>
            {categories.length > 0 && (
              <>
                <h2 className="h6 mt-4">Áreas de atuação</h2>
                <ul className="list-unstyled d-flex flex-wrap gap-2 mb-0">
                  {categories.map((category) => (
                    <li key={category} className="service-category text-break">
                      {category}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
          <section aria-labelledby="freelancer-services">
            <h2 id="freelancer-services" className="h4 mb-3">
              Serviços publicados
            </h2>
            {profile.services.length === 0 ? (
              <p>Este freelancer ainda não publicou serviços.</p>
            ) : (
              <div className="row g-4">
                {profile.services.map((service) => (
                  <div key={service.id} className="col-12 col-md-6 col-lg-4">
                    <ServiceCard
                      service={{
                        ...service,
                        freelancer: {
                          id: profile.id,
                          name: profile.name,
                          profile: profile.profile,
                        },
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
