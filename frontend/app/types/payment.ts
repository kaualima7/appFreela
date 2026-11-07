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
export function paymentTotals(payments: Payment[]) {
  let received = BigInt(0);
  let pending = BigInt(0);
  for (const payment of payments) {
    const [whole, fraction = ""] = payment.amount.split(".");
    const cents = BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, "0"));
    if (payment.status === "PAID") received += cents;
    if (payment.status === "PENDING") pending += cents;
  }
  return { registered: received + pending, received, pending };
}
export function formatCents(cents: bigint) {
  return `R$ ${(cents / BigInt(100)).toLocaleString("pt-BR")},${(cents % BigInt(100)).toString().padStart(2, "0")}`;
}
