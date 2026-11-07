"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { API_URL, managementError } from "@/app/api";
import { authenticatedFetch } from "@/app/login/auth_service";
import { projectDate, projectStatuses, money } from "@/app/types/management";
import type { ClientProject } from "@/app/types/payment";
import ProjectPayments from "@/app/components/ProjectPayments";
export default function ClientProjectDetails() {
  const { id } = useParams<{ id: string }>();
  return <ProjectDetails key={id} id={id} />;
}
function ProjectDetails({ id }: { id: string }) {
  const [project, setProject] = useState<ClientProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    async function load() {
      try {
        if (!/^[1-9]\d*$/.test(id) || Number(id) > 2147483647)
          throw new Error(
            "Projeto não encontrado ou indisponível para sua conta.",
          );
        const response = await authenticatedFetch(
          `${API_URL}/client-portal/projects/${id}`,
          {
            signal: AbortSignal.any([
              controller.signal,
              AbortSignal.timeout(15000),
            ]),
          },
        );
        if (!response.ok) throw new Error(await managementError(response));
        const selected: ClientProject = await response.json();
        if (active) setProject(selected);
      } catch (error) {
        if (active)
          setError(
            error instanceof Error &&
              !(error instanceof TypeError) &&
              error.name !== "TimeoutError"
              ? error.message
              : "Não foi possível carregar o projeto. Tente novamente.",
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
  }, [id, revision]);
  return (
    <section>
      <Link href="/client/projects">Voltar aos meus projetos</Link>
      {loading ? (
        <p role="status">Carregando projeto...</p>
      ) : error ? (
        <div className="alert alert-warning mt-4" role="alert">
          <p>{error}</p>
          <button
            className="btn btn-outline-primary"
            onClick={() => {
              setLoading(true);
              setError("");
              setRevision((previous) => previous + 1);
            }}
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        project && (
          <>
            <article className="card card-body mt-4 p-4">
              <h1 className="h2">{project.title}</h1>
              <p>Freelancer: {project.projectOwner.name}</p>
              <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                {project.description || "Sem descrição."}
              </p>
              <p>
                Início: {projectDate(project.startDate)}
                <br />
                Prazo: {projectDate(project.deadline)}
                <br />
                Situação: {projectStatuses[project.status]}
                <br />
                Valor: {money(project.value)}
              </p>
            </article>
            <ProjectPayments key={project.id} projectId={project.id} readOnly />
          </>
        )
      )}
    </section>
  );
}
