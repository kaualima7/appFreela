"use client";

import Link from "next/link";
import { useSession } from "@/app/components/SessionProvider";

export default function Client() {
  const { user } = useSession();
  if (!user) return null;
  return (
    <section className="account-home card card-body p-4 p-md-5">
      <p className="section-label">ÁREA DO CLIENTE</p>
      <h1 className="h3 fw-bold mb-3">Olá, {user.name}.</h1>
      <p className="text-secondary mb-4">
        Tipo de conta: <strong>Cliente</strong>
      </p>
      <p className="text-secondary">
        Explore os serviços na vitrine e acompanhe aqueles em que você
        demonstrou interesse.
      </p>
      <div className="d-flex flex-wrap gap-2 mt-2">
        <Link href="/client/projects" className="btn btn-outline-primary">
          Meus projetos
        </Link>
        <Link href="/client/interests" className="btn btn-primary">
          Meus interesses
        </Link>
        <Link href="/" className="btn btn-outline-primary">
          Voltar à vitrine
        </Link>
      </div>
    </section>
  );
}
