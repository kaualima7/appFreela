import type { Project } from "./management";
export type ClientProject = Omit<Project, "clientId"> & {
  projectOwner: { id: number; name: string };
};
export const paymentStatuses = {
  PENDING: "Pendente",
  PAID: "Pago",
  CANCELLED: "Cancelado",
};
export type Payment = {
  id: number;
  projectId: number;
  amount: string;
  dueDate: string;
  paidAt: string | null;
  paymentMethod: string | null;
  status: keyof typeof paymentStatuses;
};
function toCents(amount: string) {
  const [whole, fraction = ""] = amount.split(".");
  return BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, "0"));
}

export function projectPaymentSummary(projectValue: string, payments: Payment[]) {
  const agreed = toCents(projectValue);
  const paid = payments.reduce(
    (total, payment) =>
      payment.status === "PAID" ? total + toCents(payment.amount) : total,
    BigInt(0),
  );
  const remaining = paid < agreed ? agreed - paid : BigInt(0);
  return { agreed, paid, remaining };
}

export function formatCents(cents: bigint) {
  return `R$ ${(cents / BigInt(100)).toLocaleString("pt-BR")},${(cents % BigInt(100)).toString().padStart(2, "0")}`;
}
