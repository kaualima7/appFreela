"use client";

import RefreshButton from "@/app/components/RefreshButton";
import { useEffect, useState } from "react";
import Link from "next/link";
import { API_URL, managementError } from "@/app/api";
import { authenticatedFetch } from "@/app/login/auth_service";
import {
  type Project,
  type ClientContact,
  projectStatuses,
  projectDate,
  money,
} from "@/app/types/management";
import ProjectFormDialog from "@/app/components/ProjectFormDialog";
import ServiceDialog from "@/app/components/service/ServiceDialog";
export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<ClientContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState("");
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    async function load() {
      try {
        const [projectsResponse, clientsResponse] = await Promise.all([
          authenticatedFetch(`${API_URL}/projects`, {
            signal: AbortSignal.any([
              controller.signal,
              AbortSignal.timeout(15000),
            ]),
          }),
          authenticatedFetch(`${API_URL}/clients`, {
            signal: AbortSignal.any([
              controller.signal,
              AbortSignal.timeout(15000),
            ]),
          }),
        ]);
        if (!projectsResponse.ok)
          throw new Error(await managementError(projectsResponse));
        if (!clientsResponse.ok)
          throw new Error(await managementError(clientsResponse));
        const projectList: Project[] = await projectsResponse.json();
        const contacts: ClientContact[] = await clientsResponse.json();
        if (active) {
          setProjects(projectList);
          setClients(contacts);
        }
      } catch (error) {
        if (active)
          setError(
            error instanceof Error && !(error instanceof TypeError)
              ? error.message
              : "Não foi possível carregar os projetos.",
          );
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [revision]);
  function reload() {
    setLoading(true);
    setError("");
    setRevision((previous) => previous + 1);
  }
  return (
    <section>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <h1 className="h2 fw-semibold mb-0">Projetos</h1>
        <div className="workspace-actions d-flex flex-wrap gap-2">
          <RefreshButton
            label="Atualizar projetos"
            onClick={reload}
            loading={loading}
          />
          <button
            type="button"
            className="btn btn-primary"
            disabled={loading || !!error}
            onClick={() => {
              setSuccess("");
              setCreating(true);
            }}
            data-dialog-return-focus
          >
            <i className="bi bi-plus-lg" aria-hidden="true" />
            Novo projeto
          </button>
        </div>
      </div>
      {success && (
        <p className="alert alert-success" role="status">
          {success}
        </p>
      )}
      {loading ? (
        <p role="status">Carregando projetos...</p>
      ) : error ? (
        <div role="alert">
          <p>{error}</p>
          <button className="btn btn-primary" onClick={reload}>
            Tentar novamente
          </button>
        </div>
      ) : (
        <>
          {projects.length === 0 ? (
            <p>Você ainda não tem projetos com clientes.</p>
          ) : (
            <div className="row g-3">
              {projects.map((project) => (
                <div className="col-12 col-md-6 col-lg-4" key={project.id}>
                  <article className="card card-body h-100">
                    <h2 className="h5">{project.title}</h2>
                    <p>
                      Cliente:{" "}
                      {clients.find((client) => client.id === project.clientId)
                        ?.name ?? `Contato #${project.clientId}`}
                    </p>
                    <p>
                      Prazo: {projectDate(project.deadline)}
                      <br />
                      Valor: {money(project.value)}
                      <br />
                      {projectStatuses[project.status]}
                    </p>
                    <Link
                      className="btn btn-outline-primary mt-auto"
                      href={`/admin/projects/${project.id}`}
                    >
                      Ver detalhes
                    </Link>
                  </article>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      {creating && clients.length > 0 && (
        <ProjectFormDialog
          clients={clients}
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            setSuccess("Projeto cadastrado.");
            reload();
          }}
        />
      )}
      {creating && clients.length === 0 && (
        <ServiceDialog
          id="project-needs-contact"
          title="Novo projeto"
          busy={false}
          onClose={() => setCreating(false)}
        >
          <p>
            Para registrar um trabalho combinado, o projeto precisa estar
            associado a um contato da sua lista.
          </p>
          <p className="text-secondary">
            Você ainda não tem contatos. Um contato pode ser de alguém que já
            tem conta no Freelike ou de alguém com quem você combinou o trabalho
            por fora.
          </p>
          <div className="d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={() => setCreating(false)}
              data-dialog-focus
            >
              Voltar
            </button>
            <Link href="/admin/clients" className="btn btn-primary">
              Ver contatos
            </Link>
          </div>
        </ServiceDialog>
      )}
    </section>
  );
}
