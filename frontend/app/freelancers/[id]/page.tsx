"use client";

// Lê o ID da URL e mostra o perfil público pelo componente FreelancerProfile.

import Link from "next/link";
import { useParams } from "next/navigation";
import FreelancerProfile from "@/app/components/FreelancerProfile";

export default function FreelancerPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <>
      <main id="freelancer-profile" className="container py-5" tabIndex={-1}>
        <div className="workspace-actions">
          <Link href="/explorar" className="btn workspace-refresh">
            <i className="bi bi-arrow-left" aria-hidden="true" />
            Voltar à vitrine
          </Link>
        </div>
        <FreelancerProfile key={id} id={id} />
      </main>
    </>
  );
}
