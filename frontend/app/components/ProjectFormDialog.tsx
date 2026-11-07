"use client";
import { useRef, useState, type FormEvent } from "react";
import { API_URL, managementError } from "../api";
import { authenticatedFetch } from "../login/auth_service";
import {
  projectStatuses,
  type Project,
  type ClientContact,
} from "../types/management";
import ServiceDialog from "./service/ServiceDialog";
export default function ProjectFormDialog({
  project,
  clients,
  onClose,
  onSaved,
}: {
  project?: Project;
  clients: ClientContact[];
  onClose: () => void;
  onSaved: (project: Project) => void;
}) {
  const [title, setTitle] = useState(project?.title ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [clientId, setClientId] = useState(String(project?.clientId ?? ""));
  const [startDate, setStartDate] = useState(
    project?.startDate.slice(0, 10) ?? "",
  );
  const [deadline, setDeadline] = useState(
    project?.deadline?.slice(0, 10) ?? "",
  );
  const [value, setValue] = useState(project?.value ?? "");
  const [status, setStatus] = useState(project?.status ?? "PLANNED");
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  const [error, setError] = useState("");
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving.current) return;
    if (
      title.trim().length < 2 ||
      !/^(0|[1-9]\d{0,8})(\.\d{1,2})?$/.test(value) ||
      !startDate ||
      (deadline && deadline < startDate) ||
      (!project && !clients.some((client) => client.id === Number(clientId)))
    ) {
      setError(
        "Confira título, cliente, valor e datas. O prazo não pode preceder o início.",
      );
      return;
    }
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await authenticatedFetch(
        `${API_URL}/projects${project ? `/${project.id}` : ""}`,
        {
          method: project ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            description,
            status,
            value,
            startDate:
              project && startDate === project.startDate.slice(0, 10)
                ? project.startDate
                : `${startDate}T00:00:00.000Z`,
            ...(deadline
              ? {
                  deadline:
                    project?.deadline &&
                    deadline === project.deadline.slice(0, 10)
                      ? project.deadline
                      : `${deadline}T00:00:00.000Z`,
                }
              : {}),
            ...(!project ? { clientId: Number(clientId) } : {}),
          }),
        },
      );
      if (!response.ok) throw new Error(await managementError(response));
      onSaved(await response.json());
    } catch (error) {
      setError(
        error instanceof Error && !(error instanceof TypeError)
          ? error.message
          : "Não foi possível salvar. Verifique sua conexão e tente novamente.",
      );
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  return (
    <ServiceDialog
      id="project-form"
      title={project ? "Editar projeto" : "Novo projeto"}
      busy={busy}
      onClose={onClose}
    >
      <form onSubmit={save}>
        <fieldset disabled={busy}>
          {!project && (
            <>
              <label htmlFor="project-client" className="form-label">
                Cliente
              </label>
              <select
                id="project-client"
                className="form-select mb-3"
                required
                value={clientId}
                onChange={(event) => setClientId(event.target.value)}
              >
                <option value="">Selecione um cliente</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </>
          )}
          <label htmlFor="project-title" className="form-label">
            Título
          </label>
          <input
            id="project-title"
            className="form-control mb-3"
            required
            minLength={2}
            maxLength={120}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            data-dialog-focus
          />
          <label htmlFor="project-description" className="form-label">
            Descrição (opcional)
          </label>
          <textarea
            id="project-description"
            className="form-control"
            maxLength={2000}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            aria-describedby="project-description-help"
          />
          <p id="project-description-help" className="small text-secondary">
            O cliente vinculado poderá ver esta descrição.
          </p>
          <label htmlFor="project-start" className="form-label">
            Data de início
          </label>
          <input
            id="project-start"
            type="date"
            className="form-control mb-3"
            required
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
          <label htmlFor="project-deadline" className="form-label">
            Prazo {project?.deadline ? "" : "(opcional)"}
          </label>
          <input
            id="project-deadline"
            type="date"
            className="form-control mb-3"
            required={!!project?.deadline}
            min={startDate || undefined}
            value={deadline}
            onChange={(event) => setDeadline(event.target.value)}
          />
          {project?.deadline && (
            <p className="small text-secondary">
              O prazo definido pode ser alterado, mas não removido.
            </p>
          )}
          <label htmlFor="project-value" className="form-label">
            Valor (R$)
          </label>
          <input
            id="project-value"
            className="form-control"
            required
            inputMode="decimal"
            pattern="(0|[1-9][0-9]{0,8})(\.[0-9]{1,2})?"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          <p className="small text-secondary">
            Use ponto para os centavos. Ex.: 1500.50
          </p>
          <label htmlFor="project-status" className="form-label">
            Situação
          </label>
          <select
            id="project-status"
            className="form-select mb-3"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as Project["status"])
            }
          >
            {Object.entries(projectStatuses).map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
          <div className="d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button className="btn btn-primary" type="submit">
              {busy ? "Salvando..." : "Salvar projeto"}
            </button>
          </div>
        </fieldset>
        {error && (
          <p role="alert" className="alert alert-danger mt-3">
            {error}
          </p>
        )}
      </form>
    </ServiceDialog>
  );
}
