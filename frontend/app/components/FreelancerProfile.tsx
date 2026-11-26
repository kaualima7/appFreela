"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/app/api";
import FreelancerAreasForm from "./FreelancerAreasForm";
import ProfileAvatar from "@/app/components/ProfileAvatar";
import ProfileNameForm from "@/app/components/ProfileNameForm";
import CartaoAnuncio from "@/app/components/service/CartaoAnuncio";
import type { PublicFreelancer } from "@/app/types/service";

export default function FreelancerProfile({
  id,
  editable = false,
}: {
  id: string;
  editable?: boolean;
}) {
  const validId = /^[1-9]\d*$/.test(id) && Number(id) <= 2147483647;
  const [profile, setProfile] = useState<PublicFreelancer | null>(null);
  const [status, setStatus] = useState<
    "loading" | "ready" | "missing" | "error"
  >(validId ? "loading" : "missing");
  const [revision, setRevision] = useState(0);
  const [editingAreas, setEditingAreas] = useState(false);
  const [areasSaved, setAreasSaved] = useState(false);

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
  const specialties = profile?.specialties ?? [];

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
            {editable && (
              <ProfileNameForm
                name={name}
                onSaved={(savedName) => {
                  setProfile((currentProfile) =>
                    currentProfile && {
                      ...currentProfile,
                      name: savedName,
                      profile: currentProfile.profile && {
                        ...currentProfile.profile,
                        fullName: savedName,
                      },
                    },
                  );
                }}
              />
            )}
            <section className="mt-4" aria-labelledby="freelancer-specialties">
              <div className="workspace-actions d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                <h2 id="freelancer-specialties" className="h6 mb-0">
                  Áreas de atuação
                </h2>
                {editable && !editingAreas && (
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={() => {
                      setAreasSaved(false);
                      setEditingAreas(true);
                    }}
                  >
                    Editar áreas
                  </button>
                )}
              </div>
              {editingAreas && editable ? (
                <FreelancerAreasForm
                  specialties={specialties}
                  onCancel={() => setEditingAreas(false)}
                  onSaved={(savedSpecialties) => {
                    setProfile((currentProfile) =>
                      currentProfile && {
                        ...currentProfile,
                        specialties: savedSpecialties,
                      },
                    );
                    setEditingAreas(false);
                    setAreasSaved(true);
                  }}
                />
              ) : specialties.length > 0 ? (
                <ul className="list-unstyled d-flex flex-wrap gap-2 mb-0">
                  {specialties.map((specialty) => (
                    <li key={specialty} className="service-category text-break">
                      {specialty}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-secondary mb-0">Nenhuma área informada.</p>
              )}
              {areasSaved && (
                <p className="small text-success mb-0 mt-2" role="status">
                  Áreas de atuação salvas.
                </p>
              )}
            </section>
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
                    <CartaoAnuncio
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
