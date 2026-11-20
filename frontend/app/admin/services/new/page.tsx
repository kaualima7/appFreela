"use client";
import { useRouter } from "next/navigation";
import ServiceForm from "@/app/components/service/ServiceForm";
export default function NewService() {
  const router = useRouter();
  return (
    <section className="service-form-page mx-auto">
      <h1 className="h2 mb-4">Novo serviço</h1>
      <div className="card card-body p-4">
        <ServiceForm
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
