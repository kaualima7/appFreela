export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export async function responseError(
  response: Response,
  fallback: string,
): Promise<string> {
  const data = await response.json().catch(() => null);
  if (Array.isArray(data?.message)) return data.message.join(" ");
  return typeof data?.message === "string" ? data.message : fallback;
}

export async function serviceError(response: Response, fallback: string) {
  if (response.status === 403)
    return "Você não tem permissão para administrar este serviço.";
  if (response.status === 404)
    return "Serviço não encontrado ou indisponível para sua conta. Atualize a lista.";
  if (response.status === 400)
    return "Confira os campos informados. Use uma URL de imagem HTTP ou HTTPS válida.";
  return responseError(response, fallback);
}

export async function interestError(response: Response, fallback: string) {
  if (response.status === 403)
    return "Sua conta não tem permissão para esta operação.";
  if (response.status === 404)
    return "Serviço ou interesse indisponível. Atualize a lista.";
  if (response.status >= 500) return fallback;
  return responseError(response, fallback);
}
