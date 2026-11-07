"use client";
import { useEffect, useState } from "react";
import { API_URL, managementError } from "../api";
import { authenticatedFetch } from "../login/auth_service";
import { money, projectDate } from "../types/management";
import {
  type Payment,
  paymentStatuses,
  paymentTotals,
  formatCents,
} from "../types/payment";
import PaymentFormDialog from "./PaymentFormDialog";
export default function ProjectPayments({
  projectId,
  readOnly = false,
}: {
  projectId: number;
  readOnly?: boolean;
}) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [editing, setEditing] = useState<Payment | null | undefined>(undefined);
  const [success, setSuccess] = useState("");
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
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
  const totals = paymentTotals(payments);
  return (
    <section className="mt-4" aria-labelledby="payments-title">
      <div className="d-flex flex-wrap justify-content-between gap-3 mb-3">
        <div>
          <h2 id="payments-title" className="h3">
            Pagamentos
          </h2>
          <p className="small text-secondary">
            Registros manuais de recebimentos.
          </p>
        </div>
        <div className="d-flex flex-wrap gap-2 align-items-start">
          <button
            type="button"
            className="btn btn-outline-primary"
            disabled={loading}
            onClick={reload}
          >
            Atualizar pagamentos
          </button>
          {!readOnly && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setSuccess("");
                setEditing(null);
              }}
              data-dialog-return-focus
            >
              Adicionar pagamento
            </button>
          )}
        </div>
      </div>
      {success && (
        <p role="status" className="alert alert-success">
          {success}
        </p>
      )}
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
          <dl className="row g-3">
            <div className="col-12 col-md-4">
              <dt>Total registrado (sem cancelados)</dt>
              <dd>{formatCents(totals.registered)}</dd>
            </div>
            <div className="col-12 col-md-4">
              <dt>Total recebido</dt>
              <dd>{formatCents(totals.received)}</dd>
            </div>
            <div className="col-12 col-md-4">
              <dt>Total pendente</dt>
              <dd>{formatCents(totals.pending)}</dd>
            </div>
          </dl>
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
                      <button
                        className="btn btn-outline-primary mt-auto"
                        aria-label={`Editar pagamento de ${money(payment.amount)} com vencimento em ${projectDate(payment.dueDate)}`}
                        onClick={() => {
                          setSuccess("");
                          setEditing(payment);
                        }}
                      >
                        Editar
                      </button>
                    )}
                  </article>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      {!readOnly && editing !== undefined && (
        <PaymentFormDialog
          projectId={projectId}
          payment={editing ?? undefined}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            setSuccess("Pagamento salvo.");
            reload();
          }}
        />
      )}
    </section>
  );
}
