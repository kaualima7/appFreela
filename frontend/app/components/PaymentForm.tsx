"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { API_URL, managementError } from "../api";
import { authenticatedFetch } from "../login/auth_service";
import { paymentStatuses, type Payment } from "../types/payment";
import JanelaModal from "./service/JanelaModal";

export type PaymentFormAction =
  | { type: "receipt" | "installment" }
  | { type: "markReceived" | "edit"; payment: Payment };

const actionTitles = {
  receipt: "Registrar recebimento",
  installment: "Adicionar parcela",
  markReceived: "Marcar como recebida",
  edit: "Editar pagamento",
};

const paymentMethods = [
  "Pix",
  "Cartão de crédito",
  "Cartão de débito",
  "Boleto",
  "Transferência bancária",
  "Dinheiro",
];

const localDate = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function paymentDate(value: string, previous?: string | null) {
  return previous?.slice(0, 10) === value ? previous : `${value}T00:00:00.000Z`;
}

export default function PaymentForm({
  projectId,
  action,
  onClose,
  onSaved,
}: {
  projectId: number;
  action: PaymentFormAction;
  onClose: () => void;
  onSaved: () => void;
}) {
  const title = actionTitles[action.type];
  const payment = "payment" in action ? action.payment : undefined;
  const editing = action.type === "edit";
  const marking = action.type === "markReceived";
  const receiving = action.type === "receipt" || marking;
  const [amount, setAmount] = useState(payment?.amount ?? "");
  const [dueDate, setDueDate] = useState(payment?.dueDate.slice(0, 10) ?? "");
  const [paidAt, setPaidAt] = useState(() =>
    receiving
      ? localDate.format(new Date())
      : (payment?.paidAt?.slice(0, 10) ?? ""),
  );
  const [status, setStatus] = useState<Payment["status"]>(
    receiving ? "PAID" : (payment?.status ?? "PENDING"),
  );
  const originalMethod = payment?.paymentMethod ?? "";
  const [paymentMethod, setPaymentMethod] = useState(originalMethod);
  const legacyMethod =
    originalMethod && !paymentMethods.includes(originalMethod);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const saving = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!editing) formRef.current?.querySelector("input")?.focus();
  }, [editing]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving.current) return;
    if (
      (!marking &&
        (!/^(0|[1-9]\d{0,8})(\.\d{1,2})?$/.test(amount) || !dueDate)) ||
      (status === "PAID" && !paidAt)
    ) {
      setError("Confira os campos do registro.");
      return;
    }
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      const receivedAt =
        status === "PAID" ? paymentDate(paidAt, payment?.paidAt) : null;
      const receiptFields = {
        status,
        paidAt: receivedAt,
        // Omitir o campo sem alteração preserva o texto livre de registros antigos.
        ...(paymentMethod !== originalMethod ? { paymentMethod } : {}),
      };
      const payload = marking
        ? receiptFields
        : {
            ...receiptFields,
            amount,
            dueDate: paymentDate(dueDate, payment?.dueDate),
            ...(!payment ? { projectId } : {}),
          };

      const response = await authenticatedFetch(
        `${API_URL}/payments${payment ? `/${payment.id}` : ""}`,
        {
          method: payment ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
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

  const form = (
    <form ref={formRef} onSubmit={save} aria-busy={busy}>
      <fieldset disabled={busy}>
        {!marking && (
          <>
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
          </>
        )}
        {editing && (
          <>
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
          </>
        )}
        {status === "PAID" && (
          <>
            <label className="form-label" htmlFor="payment-paid">
              Data do recebimento
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
        {(editing || receiving) && (
          <>
            <label className="form-label" htmlFor="payment-method">
              Forma de pagamento (opcional)
            </label>
            <select
              id="payment-method"
              className="form-select mb-3"
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
            >
              <option value="">Não informada</option>
              {legacyMethod && (
                <option value={originalMethod}>
                  {originalMethod} (registro anterior)
                </option>
              )}
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </>
        )}
        <div className="workspace-actions d-flex flex-wrap justify-content-end gap-2">
          <button
            className="btn btn-outline-primary"
            type="button"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button className="btn btn-primary" type="submit">
            {busy
              ? "Salvando..."
              : marking
                ? "Confirmar recebimento"
                : "Salvar pagamento"}
          </button>
        </div>
      </fieldset>
      {error && (
        <p className="alert alert-danger mt-3 mb-0" role="alert">
          {error}
        </p>
      )}
    </form>
  );

  return editing ? (
    <JanelaModal
      id="payment-form"
      title={title}
      busy={busy}
      onClose={onClose}
    >
      {form}
    </JanelaModal>
  ) : (
    <section
      className={marking ? "border-top mt-3 pt-3" : "card card-body mb-4"}
      aria-labelledby="payment-form-title"
    >
      <h3 id="payment-form-title" className="h5 mb-3">
        {title}
      </h3>
      {form}
    </section>
  );
}
