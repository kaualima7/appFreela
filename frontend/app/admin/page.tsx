"use client";

import Link from "next/link";
import { useSession } from "@/app/components/SessionProvider";

export default function Admin() {
  const { user } = useSession();
  if (!user) return null;
  return (
    <section className="account-home card card-body p-4 p-md-5">
      <p className="section-label">ÁREA DO FREELANCER</p>
      <h1 className="h3 fw-bold mb-3">Olá, {user.name}.</h1>
      <p className="text-secondary mb-4">
        Tipo de conta: <strong>Freelancer</strong>
      </p>
      <p className="text-secondary">
        Publique serviços na vitrine e gerencie seus rascunhos.
      </p>
      <div className="d-flex flex-wrap gap-2 mt-2">
        <Link href="/admin/services" className="btn btn-primary">
          Meus serviços
        </Link>
        <Link href="/" className="btn btn-outline-primary">
          Voltar à vitrine
        </Link>
      </div>
    </section>
  );
}
