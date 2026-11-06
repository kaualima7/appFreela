"use client";

import { useEffect, useState } from "react";
import { API_URL, serviceError } from "@/app/api";
import { authenticatedFetch } from "@/app/login/auth_service";
import type { FreelancerService } from "@/app/types/service";
import ManagedServiceCard from "@/app/components/service/ManagedServiceCard";
import ServiceFormDialog from "@/app/components/service/ServiceFormDialog";
import ServiceDialog from "@/app/components/service/ServiceDialog";

export default function MyServices() {
  const [services, setServices] = useState<FreelancerService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [requestVersion, setRequestVersion] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editingService, setEditingService] =
    useState<FreelancerService | null>(null);
  const [serviceToDelete, setServiceToDelete] =
    useState<FreelancerService | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 15000);
    async function loadServices() {
      try {
        const response = await authenticatedFetch(`${API_URL}/services/mine`, {
          signal: controller.signal,
        });
        if (!response.ok)
          throw new Error(
            await serviceError(
              response,
              "Não foi possível carregar seus serviços.",
            ),
          );
        const ownServices: FreelancerService[] | null = await response
          .json()
          .catch(() => null);
        if (!Array.isArray(ownServices))
          throw new Error("Não foi possível carregar seus serviços.");
        if (active) setServices(ownServices);
      } catch (error) {
        if (active)
          setError(
            error instanceof Error &&
              !(error instanceof TypeError) &&
              error.name !== "AbortError"
              ? error.message
              : "Não foi possível conectar. Verifique sua conexão e tente novamente.",
          );
      } finally {
        clearTimeout(timeout);
        if (active) setLoading(false);
      }
    }
    void loadServices();
    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [requestVersion]);

  function reload() {
    setLoading(true);
    setError("");
    setRequestVersion((previousVersion) => previousVersion + 1);
  }

  function newService() {
    setNotice("");
    setEditingService(null);
    setFormOpen(true);
  }

  function editService(service: FreelancerService) {
    setNotice("");
    setEditingService(service);
    setFormOpen(true);
  }

  function confirmDelete(service: FreelancerService) {
    setNotice("");
    setDeleteError("");
    setServiceToDelete(service);
  }

  async function deleteService() {
    if (!serviceToDelete || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const response = await authenticatedFetch(
        `${API_URL}/services/${serviceToDelete.id}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        setDeleteError(
          await serviceError(
            response,
            "Não foi possível excluir o serviço. Tente novamente.",
          ),
        );
        return;
      }
      setServiceToDelete(null);
      setNotice("Serviço excluído.");
      reload();
    } catch {
      setDeleteError(
        "Não foi possível conectar. Verifique sua conexão e tente novamente.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section aria-labelledby="my-services-title">
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
        <div>
          <p className="section-label mb-2">ÁREA DO FREELANCER</p>
          <h1 id="my-services-title" className="h2 fw-bold mb-2">
            Meus serviços
          </h1>
          <p className="text-secondary mb-0">
            Gerencie suas publicações e seus rascunhos.
          </p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={reload}
            disabled={loading}
          >
            Atualizar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={newService}
            data-dialog-return-focus
          >
            <i className="bi bi-plus-lg me-2" aria-hidden="true" />
            Novo serviço
          </button>
        </div>
      </div>
      {notice && (
        <div className="alert alert-success" role="status">
          {notice}
        </div>
      )}
      <div aria-busy={loading}>
        {loading ? (
          <div className="catalog-state text-center" role="status">
            <span
              className="spinner-border text-primary mb-3"
              aria-hidden="true"
            />
            <p className="text-secondary mb-0">Carregando seus serviços...</p>
          </div>
        ) : error ? (
          <div className="catalog-state text-center" role="alert">
            <h2 className="h5">Não foi possível carregar seus serviços</h2>
            <p className="text-secondary">{error}</p>
            <button type="button" className="btn btn-primary" onClick={reload}>
              Tentar novamente
            </button>
          </div>
        ) : services.length === 0 ? (
          <div className="catalog-state text-center" role="status">
            <span className="state-icon mb-3">
              <i className="bi bi-grid" aria-hidden="true" />
            </span>
            <h2 className="h5">Você ainda não tem serviços</h2>
            <p className="text-secondary mb-0">
              Cadastre seu primeiro serviço pelo botão Novo serviço.
            </p>
          </div>
        ) : (
          <div className="row g-4">
            {services.map((service) => (
              <div key={service.id} className="col-12 col-md-6 col-lg-4">
                <ManagedServiceCard
                  service={service}
                  onEdit={editService}
                  onDelete={confirmDelete}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      {formOpen && (
        <ServiceFormDialog
          service={editingService}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            setNotice(
              editingService ? "Serviço atualizado." : "Serviço criado.",
            );
            reload();
          }}
        />
      )}
      {serviceToDelete && (
        <ServiceDialog
          id="delete-service"
          title="Excluir serviço"
          busy={deleting}
          onClose={() => setServiceToDelete(null)}
        >
          {deleteError && (
            <div className="alert alert-danger" role="alert">
              {deleteError}
            </div>
          )}
          <p>
            Excluir <strong>{serviceToDelete.title}</strong>?
          </p>
          <p className="text-secondary">
            Os interesses associados também serão removidos. Esta ação não pode
            ser desfeita.
          </p>
          <div className="d-flex flex-wrap justify-content-end gap-2 dialog-actions">
            <button
              type="button"
              className="btn btn-outline-primary"
              disabled={deleting}
              onClick={() => setServiceToDelete(null)}
              data-dialog-focus
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-danger"
              disabled={deleting}
              onClick={deleteService}
            >
              {deleting ? "Excluindo..." : "Excluir serviço"}
            </button>
          </div>
        </ServiceDialog>
      )}
    </section>
  );
}
