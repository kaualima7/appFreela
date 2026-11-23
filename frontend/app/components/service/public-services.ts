import { API_URL } from "@/app/api";
import type { PublicService } from "@/app/types/service";

export async function loadPublicServices(signal: AbortSignal) {
  const response = await fetch(`${API_URL.replace(/\/$/, "")}/services`, {
    signal,
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Falha ao consultar os serviços.");
  const services: PublicService[] = await response.json();
  if (!Array.isArray(services)) throw new Error("Resposta inválida da API.");
  return services;
}