"use client";
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
      <div className="d-flex flex-wrap justify-content-between gap-3 mb-4">
        <h1>Projetos</h1>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-primary"
            disabled={loading}
            onClick={reload}
          >
            Atualizar
          </button>
          <button
            className="btn btn-primary"
            disabled={loading || !!error || clients.length === 0}
            onClick={() => {
              setSuccess("");
              setCreating(true);
            }}
            data-dialog-return-focus
          >
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
          {clients.length === 0 && (
            <p>
              Cadastre um cliente antes de criar um projeto.{" "}
              <Link href="/admin/clients">Ir para Clientes</Link>
            </p>
          )}
          {projects.length === 0 ? (
            <p>Nenhum projeto cadastrado.</p>
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
      {creating && (
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
    </section>
  );
}
