"use client";

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
