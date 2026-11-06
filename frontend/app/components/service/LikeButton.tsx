"use client";

import Link from "next/link";
import { useState } from "react";
import type { PublicService } from "@/app/types/service";
import { useSession } from "../SessionProvider";
import { useInterests } from "../InterestsProvider";
import ServiceDialog from "./ServiceDialog";

export default function LikeButton({
  service,
  onlyWithdraw = false,
}: {
  service: PublicService;
  onlyWithdraw?: boolean;
}) {
  const { user, checking, error: sessionError } = useSession();
  const {
    interests,
    loading,
    error: interestsError,
    changeInterest,
    isPending,
    reload,
  } = useInterests();
  const [dialog, setDialog] = useState<"login" | "confirm" | null>(null);
  const [error, setError] = useState("");
  const liked =
    onlyWithdraw ||
    interests.some((interest) => interest.serviceId === service.id);
  const pending = isPending(service.id);
  const requiresLogin = dialog === "login" || (!checking && !user);

  async function update(interested: boolean) {
    setError("");
    const result = await changeInterest(service, interested);
    if (result.ok) setDialog(null);
    else setError(result.error);
  }

  if (user?.accountType === "FREELANCER") return null;
  return (
    <div className="like-action mt-3">
      <button
        type="button"
        className={`btn w-100 ${liked ? "btn-primary" : "btn-outline-primary"}`}
        aria-label={`${liked ? "Retirar like" : "Dar like"} em ${service.title}`}
        aria-pressed={liked}
        disabled={
          checking ||
          !!sessionError ||
          pending ||
          (!!user && (loading || !!interestsError))
        }
        onClick={() => {
          setError("");
          if (!user) setDialog("login");
          else if (liked) void update(false);
          else setDialog("confirm");
        }}
      >
        <i
          className={`bi ${liked ? "bi-heart-fill" : "bi-heart"} me-2`}
          aria-hidden="true"
        />
        {pending ? "Aguarde..." : liked ? "Retirar like" : "Dar like"}
      </button>
      {error && !dialog && user?.accountType === "CLIENT" && (
        <div className="small mt-2" role="alert">
          <p className="text-danger mb-1">{error}</p>
          <button
            type="button"
            className="btn btn-link btn-sm p-0"
            onClick={reload}
          >
            Atualizar likes
          </button>
        </div>
      )}
      {dialog && (
        <ServiceDialog
          id={`like-${service.id}`}
          title={requiresLogin ? "Entre para dar like" : "Confirmar interesse"}
          busy={pending}
          onClose={() => setDialog(null)}
        >
          {requiresLogin ? (
            <>
              <p>Entre com uma conta de cliente para dar like neste serviço.</p>
              <div className="d-flex justify-content-end gap-2 dialog-actions">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => setDialog(null)}
                >
                  Cancelar
                </button>
                <Link
                  href="/login"
                  className="btn btn-primary"
                  data-dialog-focus
                >
                  Entrar
                </Link>
              </div>
            </>
          ) : (
            <>
              <p>
                Demonstrar interesse em <strong>{service.title}</strong>?
              </p>
              <p className="text-secondary">
                Seu nome e e-mail ficarão disponíveis para o freelancer.
              </p>
              {error && (
                <p className="alert alert-danger" role="alert">
                  {error}
                </p>
              )}
              <div className="d-flex flex-wrap justify-content-end gap-2 dialog-actions">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  disabled={pending}
                  onClick={() => setDialog(null)}
                  data-dialog-focus
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={pending}
                  onClick={() => void update(true)}
                >
                  {pending ? "Confirmando..." : "Confirmar like"}
                </button>
              </div>
            </>
          )}
        </ServiceDialog>
      )}
    </div>
  );
}
