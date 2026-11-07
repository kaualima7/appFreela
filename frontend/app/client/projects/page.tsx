"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { API_URL, managementError } from "@/app/api";
import { authenticatedFetch } from "@/app/login/auth_service";
import { projectDate, projectStatuses, money } from "@/app/types/management";
import type { ClientProject } from "@/app/types/payment";
export default function ClientProjects() {
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    async function load() {
      try {
        const response = await authenticatedFetch(
          `${API_URL}/client-portal/projects`,
          {
            signal: AbortSignal.any([
              controller.signal,
              AbortSignal.timeout(15000),
            ]),
          },
        );
        if (!response.ok) throw new Error(await managementError(response));
        const received: ClientProject[] = await response.json();
        if (!Array.isArray(received))
          throw new Error("Não foi possível carregar seus projetos.");
        if (active) setProjects(received);
      } catch (error) {
        if (active)
          setError(
            error instanceof Error &&
              !(error instanceof TypeError) &&
              error.name !== "TimeoutError"
              ? error.message
              : "Não foi possível carregar seus projetos. Tente novamente.",
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
        <h1>Meus projetos</h1>
        <button
          className="btn btn-outline-primary"
          onClick={reload}
          disabled={loading}
        >
          Atualizar projetos
        </button>
      </div>
      {loading ? (
        <p role="status">Carregando seus projetos...</p>
      ) : error ? (
        <div role="alert">
          <p>{error}</p>
          <button className="btn btn-primary" onClick={reload}>
            Tentar novamente
          </button>
        </div>
      ) : projects.length === 0 ? (
        <p>Você ainda não tem projetos vinculados à sua conta.</p>
      ) : (
        <div className="row g-3">
          {projects.map((project) => (
            <div className="col-12 col-md-6 col-lg-4" key={project.id}>
              <article className="card card-body h-100">
                <h2 className="h5">{project.title}</h2>
                <p>Freelancer: {project.projectOwner.name}</p>
                <p>
                  Situação: {projectStatuses[project.status]}
                  <br />
                  Prazo: {projectDate(project.deadline)}
                  <br />
                  Valor: {money(project.value)}
                </p>
                <Link
                  href={`/client/projects/${project.id}`}
                  className="btn btn-outline-primary mt-auto"
                >
                  Ver detalhes
                </Link>
              </article>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
