"use client";
import { useRef, useState, type FormEvent } from "react";
import { API_URL, managementError } from "../api";
import { authenticatedFetch } from "../login/auth_service";
import { paymentStatuses, type Payment } from "../types/payment";
import ServiceDialog from "./service/ServiceDialog";
export default function PaymentFormDialog({
  projectId,
  payment,
  onClose,
  onSaved,
}: {
  projectId: number;
  payment?: Payment;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [amount, setAmount] = useState(payment?.amount ?? "");
  const [dueDate, setDueDate] = useState(payment?.dueDate.slice(0, 10) ?? "");
  const [paidAt, setPaidAt] = useState(payment?.paidAt?.slice(0, 10) ?? "");
  const [status, setStatus] = useState<Payment["status"]>(
    payment?.status ?? "PENDING",
  );
  const [paymentMethod, setPaymentMethod] = useState(
    payment?.paymentMethod ?? "",
  );
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  const [error, setError] = useState("");
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving.current) return;
    if (
      !/^(0|[1-9]\d{0,8})(\.\d{1,2})?$/.test(amount) ||
      !dueDate ||
      (status === "PAID" && !paidAt)
    ) {
      setError("Confira o valor, o vencimento e a data de pagamento.");
      return;
    }
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await authenticatedFetch(
        `${API_URL}/payments${payment ? `/${payment.id}` : ""}`,
        {
          method: payment ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount,
            status,
            paymentMethod: paymentMethod.trim(),
            dueDate:
              payment && dueDate === payment.dueDate.slice(0, 10)
                ? payment.dueDate
                : `${dueDate}T00:00:00.000Z`,
            paidAt:
              status === "PAID"
                ? payment?.paidAt && paidAt === payment.paidAt.slice(0, 10)
                  ? payment.paidAt
                  : `${paidAt}T00:00:00.000Z`
                : null,
            ...(!payment ? { projectId } : {}),
          }),
        },
      );
      if (!response.ok) throw new Error(await managementError(response));
      onSaved();
    } catch (error) {
      setError(
        error instanceof Error &&
          !(error instanceof TypeError) &&
          error.name !== "TimeoutError"
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
      id="payment-form"
      title={payment ? "Editar pagamento" : "Adicionar pagamento"}
      busy={busy}
      onClose={onClose}
    >
      <form onSubmit={save}>
        <p className="text-secondary">Registro manual de recebimento.</p>
        <fieldset disabled={busy}>
          <label className="form-label" htmlFor="payment-amount">
            Valor (R$)
          </label>
          <input
            id="payment-amount"
            className="form-control"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            required
            inputMode="decimal"
            pattern="(0|[1-9][0-9]{0,8})(\.[0-9]{1,2})?"
            data-dialog-focus
          />
          <p className="small text-secondary">
            Use ponto para os centavos. Ex.: 1500.50
          </p>
          <label className="form-label" htmlFor="payment-due">
            Vencimento
          </label>
          <input
            id="payment-due"
            type="date"
            className="form-control mb-3"
            required
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
          <label className="form-label" htmlFor="payment-status">
            Situação
          </label>
          <select
            id="payment-status"
            className="form-select mb-3"
            value={status}
            onChange={(event) => {
              const selected = event.target.value as Payment["status"];
              setStatus(selected);
              if (selected !== "PAID") setPaidAt("");
            }}
          >
            {Object.entries(paymentStatuses).map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
          {status === "PAID" && (
            <>
              <label className="form-label" htmlFor="payment-paid">
                Data de pagamento
              </label>
              <input
                id="payment-paid"
                type="date"
                className="form-control mb-3"
                required
                value={paidAt}
                onChange={(event) => setPaidAt(event.target.value)}
              />
            </>
          )}
          <label className="form-label" htmlFor="payment-method">
            Forma de pagamento (opcional)
          </label>
          <input
            id="payment-method"
            className="form-control mb-3"
            maxLength={100}
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value)}
          />
          <div className="d-flex justify-content-end gap-2">
            <button
              className="btn btn-outline-primary"
              type="button"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button className="btn btn-primary" type="submit">
              {busy ? "Salvando..." : "Salvar pagamento"}
            </button>
          </div>
        </fieldset>
        {error && (
          <p className="alert alert-danger mt-3" role="alert">
            {error}
          </p>
        )}
      </form>
    </ServiceDialog>
  );
}
