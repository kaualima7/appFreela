"use client";

// Abre o perfil do freelancer autenticado com as opções de edição habilitadas.

import FreelancerProfile from "@/app/components/FreelancerProfile";
import { useSession } from "@/app/components/SessionProvider";

export default function MyFreelancerProfile() {
  const { user } = useSession();
  if (user?.accountType !== "FREELANCER") return null;

  return (
    <>
      <p className="section-label mb-0">Meu perfil</p>
      <FreelancerProfile key={user.id} id={String(user.id)} editable />
    </>
  );
}
