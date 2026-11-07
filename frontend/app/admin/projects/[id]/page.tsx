"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
import ProjectPayments from "@/app/components/ProjectPayments";
export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  return <ProjectDetailsContent key={id} id={id} />;
}

function ProjectDetailsContent({ id }: { id: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [client, setClient] = useState<ClientContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [editing, setEditing] = useState(false);
  const [success, setSuccess] = useState("");
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    async function load() {
      try {
        if (!/^[1-9]\d*$/.test(id) || Number(id) > 2147483647)
          throw new Error("Projeto inválido.");
        const response = await authenticatedFetch(`${API_URL}/projects/${id}`, {
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(15000),
          ]),
        });
        if (!response.ok) throw new Error(await managementError(response));
        const selected: Project = await response.json();
        const clientResponse = await authenticatedFetch(
          `${API_URL}/clients/${selected.clientId}`,
          {
            signal: AbortSignal.any([
              controller.signal,
              AbortSignal.timeout(15000),
            ]),
          },
        );
        if (!clientResponse.ok)
          throw new Error(await managementError(clientResponse));
        const contact: ClientContact = await clientResponse.json();
        if (active) {
          setProject(selected);
          setClient(contact);
        }
      } catch (error) {
        if (active)
          setError(
            error instanceof Error && !(error instanceof TypeError)
              ? error.message
              : "Não foi possível carregar o projeto.",
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
    <section key={id}>
      <Link href="/admin/projects">Voltar aos projetos</Link>
      {loading ? (
        <p role="status">Carregando projeto...</p>
      ) : error ? (
        <div role="alert">
          <p>{error}</p>
          <button
            className="btn btn-primary"
            onClick={() => {
              setError("");
              setLoading(true);
              setRevision((previous) => previous + 1);
            }}
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        project && (
          <article className="card card-body mt-4 p-4">
            <h1 className="h2">{project.title}</h1>
            {success && (
              <p className="alert alert-success" role="status">
                {success}
              </p>
            )}
            <p>Cliente: {client?.name}</p>
            <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
              {project.description || "Sem descrição."}
            </p>
            <p>
              Início: {projectDate(project.startDate)}
              <br />
              Prazo: {projectDate(project.deadline)}
              <br />
              Valor: {money(project.value)}
              <br />
              Situação: {projectStatuses[project.status]}
            </p>
            <button
              className="btn btn-primary align-self-start"
              onClick={() => {
                setSuccess("");
                setEditing(true);
              }}
            >
              Editar projeto
            </button>
          </article>
        )
      )}
      {editing && project && (
        <ProjectFormDialog
          project={project}
          clients={client ? [client] : []}
          onClose={() => setEditing(false)}
          onSaved={(updated) => {
            setProject(updated);
            setEditing(false);
            setSuccess("Projeto salvo.");
          }}
        />
      )}
      {!loading && !error && project && (
        <ProjectPayments key={project.id} projectId={project.id} />
      )}
    </section>
  );
}
