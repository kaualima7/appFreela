export type ClientContact = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
  clientUserId: number | null;
};
export type ClientAccount = { id: number; name: string; email: string };
export const projectStatuses = {
  PLANNED: "Planejado",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
};
export type Project = {
  id: number;
  clientId: number;
  title: string;
  description: string | null;
  startDate: string;
  deadline: string | null;
  value: string;
  status: keyof typeof projectStatuses;
};
export const money = (value: string) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(value),
  );
export const projectDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
        new Date(value),
      )
    : "Sem prazo";
