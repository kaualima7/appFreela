"use client";

// Mostra os pagamentos e o saldo de um projeto, na área do freelancer ou do cliente.
// readOnly escolhe as rotas de consulta do cliente e oculta as ações de edição.

import RefreshButton from "@/app/components/RefreshButton";
import { useEffect, useState } from "react";
import { API_URL, managementError } from "../api";
import { authenticatedFetch } from "../login/auth_service";
import { money, projectDate } from "../types/management";
import {
  type Payment,
  paymentStatuses,
  projectPaymentSummary,
  formatCents,
} from "../types/payment";
import PaymentForm, { type PaymentFormAction } from "./PaymentForm";
export default function ProjectPayments({
  projectId,
  projectValue,
  readOnly = false,
}: {
  projectId: number;
  projectValue: string;
  readOnly?: boolean;
}) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [formAction, setFormAction] = useState<PaymentFormAction | null>(null);
  const [success, setSuccess] = useState("");
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    // Usa /payments para o freelancer e /client-portal/payments para o cliente, filtrando pelo projeto.
    async function load() {
      try {
        const response = await authenticatedFetch(
          `${API_URL}/${readOnly ? "client-portal/payments" : "payments"}?projectId=${projectId}`,
          {
            signal: AbortSignal.any([
              controller.signal,
              AbortSignal.timeout(15000),
            ]),
          },
        );
        if (!response.ok) throw new Error(await managementError(response));
        const received: Payment[] = await response.json();
        if (!Array.isArray(received))
          throw new Error("Não foi possível carregar os pagamentos.");
        if (active) setPayments(received);
      } catch (error) {
        if (active)
          setError(
            error instanceof Error &&
              !(error instanceof TypeError) &&
              error.name !== "TimeoutError"
              ? error.message
              : "Não foi possível carregar os pagamentos. Tente novamente.",
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
  }, [projectId, readOnly, revision]);
  function reload() {
    setLoading(true);
    setError("");
    setRevision((previous) => previous + 1);
  }
  // Escolhe a ação que PaymentForm deve abrir: parcela, recebimento ou edição.
  function openForm(action: PaymentFormAction) {
    setSuccess("");
    setFormAction(action);
  }

  // Calcula recebido e saldo com projectPaymentSummary, em types/payment.ts.
  const summary = projectPaymentSummary(projectValue, payments);
  const form = !readOnly && formAction && (
    <PaymentForm
      projectId={projectId}
      action={formAction}
      onClose={() => setFormAction(null)}
      onSaved={() => {
        setFormAction(null);
        setSuccess("Pagamento salvo.");
        reload();
      }}
    />
  );
  return (
    <section className="mt-4" aria-labelledby="payments-title">
      <div className="d-flex flex-wrap justify-content-between gap-3 mb-3">
        <div>
          <h2 id="payments-title" className="h3">
            Pagamentos
          </h2>
          <p className="small text-secondary">
            {readOnly
              ? "Os pagamentos são combinados diretamente com o freelancer."
              : "Registros manuais de recebimentos."}
          </p>
        </div>
        <div className="workspace-actions d-flex flex-wrap gap-2 align-items-start">
          <RefreshButton
            label="Atualizar pagamentos"
            onClick={reload}
            loading={loading}
            disabled={formAction !== null}
          />
          {!readOnly && (
            <>
              <button
                type="button"
                className="btn btn-primary"
                disabled={formAction !== null}
                onClick={() => openForm({ type: "receipt" })}
                data-dialog-return-focus
              >
                Registrar recebimento
              </button>
              <button
                type="button"
                className="btn btn-outline-primary"
                disabled={formAction !== null}
                onClick={() => openForm({ type: "installment" })}
              >
                Adicionar parcela
              </button>
            </>
          )}
        </div>
      </div>
      {success && (
        <p role="status" className="alert alert-success">
          {success}
        </p>
      )}
      {(formAction?.type === "receipt" || formAction?.type === "installment") &&
        form}
      {loading ? (
        <p role="status">Carregando pagamentos...</p>
      ) : error ? (
        <div role="alert" className="alert alert-warning">
          <p>{error}</p>
          <button className="btn btn-outline-primary" onClick={reload}>
            Tentar carregar pagamentos novamente
          </button>
        </div>
      ) : (
        <>
          <section
            className="card card-body mb-4"
            aria-labelledby="payments-summary-title"
          >
            <h3 id="payments-summary-title" className="h5 mb-3">
              Resumo de pagamentos
            </h3>
            <dl className="row g-3 mb-0">
              <div className="col-12 col-md-4">
                <dt>Valor combinado</dt>
                <dd className="mb-0">{formatCents(summary.agreed)}</dd>
              </div>
              <div className="col-12 col-md-4">
                <dt>Já pago</dt>
                <dd className="mb-0">{formatCents(summary.paid)}</dd>
              </div>
              <div className="col-12 col-md-4">
                <dt>Falta pagar</dt>
                <dd className="mb-0">{formatCents(summary.remaining)}</dd>
              </div>
            </dl>
          </section>
          {payments.length === 0 ? (
            <p>Nenhum pagamento registrado para este projeto.</p>
          ) : (
            <div className="row g-3">
              {payments.map((payment) => (
                <div className="col-12 col-md-6 col-lg-4" key={payment.id}>
                  <article className="card card-body h-100">
                    <h3 className="h5">{money(payment.amount)}</h3>
                    <p>
                      Vencimento: {projectDate(payment.dueDate)}
                      <br />
                      Situação: {paymentStatuses[payment.status]}
                    </p>
                    {payment.paidAt && (
                      <p>Pago em: {projectDate(payment.paidAt)}</p>
                    )}
                    {payment.paymentMethod && (
                      <p className="text-break">
                        Forma de pagamento: {payment.paymentMethod}
                      </p>
                    )}
                    {!readOnly && (
                      <div className="workspace-actions d-flex flex-wrap gap-2 mt-auto">
                        {payment.status === "PENDING" && (
                          <button
                            type="button"
                            className="btn btn-primary"
                            disabled={formAction !== null}
                            onClick={() =>
                              openForm({ type: "markReceived", payment })
                            }
                          >
                            Marcar como recebida
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-outline-primary"
                          aria-label={`Editar pagamento de ${money(payment.amount)} com vencimento em ${projectDate(payment.dueDate)}`}
                          disabled={formAction !== null}
                          onClick={() => openForm({ type: "edit", payment })}
                        >
                          Editar
                        </button>
                      </div>
                    )}
                    {formAction?.type === "markReceived" &&
                      formAction.payment.id === payment.id &&
                      form}
                  </article>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      {formAction?.type === "edit" && form}
    </section>
  );
}
