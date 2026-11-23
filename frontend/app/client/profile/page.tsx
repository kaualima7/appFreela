"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/app/api";
import ProfileAvatar from "@/app/components/ProfileAvatar";
import { useSession } from "@/app/components/SessionProvider";
import { authenticatedFetch } from "@/app/login/auth_service";

type OwnProfile = { fullName: string; avatarUrl: string | null };

export default function ClientProfilePage() {
  const { user } = useSession();
  if (user?.accountType !== "CLIENT") return null;
  return (
    <ClientProfile key={user.id} accountName={user.name} email={user.email} />
  );
}

function ClientProfile({
  accountName,
  email,
}: {
  accountName: string;
  email: string;
}) {
  const [profile, setProfile] = useState<OwnProfile | null>(null);
  const [profileStatus, setProfileStatus] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [profileRevision, setProfileRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    async function loadProfile() {
      try {
        const response = await authenticatedFetch(`${API_URL}/profiles/me`, {
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(15000),
          ]),
        });
        if (response.status === 404) {
          if (active) setProfileStatus("ready");
          return;
        }
        if (!response.ok) throw new Error();
        const result: OwnProfile | null = await response.json();
        if (active) {
          setProfile(result);
          setProfileStatus("ready");
        }
      } catch {
        if (active) setProfileStatus("error");
      }
    }
    void loadProfile();
    return () => {
      active = false;
      controller.abort();
    };
  }, [profileRevision]);

  const name = profile?.fullName?.trim() || accountName;
  return (
    <section className="account-home card card-body p-4 p-md-5">
      <h1 className="h2 mb-4">Meu perfil</h1>
      <div className="d-flex align-items-center gap-3 mb-4">
        <ProfileAvatar name={name} avatarUrl={profile?.avatarUrl} />
        <div className="text-break">
          <p className="h4 mb-1">{name}</p>
          <p className="mb-0 text-secondary">{email}</p>
        </div>
      </div>
      {profileStatus === "loading" && <p role="status">Carregando perfil...</p>}
      {profileStatus === "error" && (
        <div className="alert alert-warning" role="alert">
          <p>Não foi possível carregar os dados do perfil.</p>
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={() => {
              setProfileStatus("loading");
              setProfileRevision((value) => value + 1);
            }}
          >
            Tentar carregar perfil novamente
          </button>
        </div>
      )}
    </section>
  );
}
