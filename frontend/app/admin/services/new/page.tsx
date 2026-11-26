"use client";
// Abre FormularioAnuncio para criar um anúncio e retorna à lista depois de salvar.

import { useRouter } from "next/navigation";
import FormularioAnuncio from "@/app/components/service/FormularioAnuncio";
export default function NewService() {
  const router = useRouter();
  return (
    <section className="service-form-page mx-auto">
      <h1 className="h2 mb-4">Novo serviço</h1>
      <div className="card card-body p-4">
        <FormularioAnuncio
          service={null}
          onClose={() => router.push("/admin/services")}
          onSaved={() => {
            sessionStorage.setItem("service-save-notice", "Serviço criado.");
            router.replace("/admin/services");
          }}
        />
      </div>
    </section>
  );
}
