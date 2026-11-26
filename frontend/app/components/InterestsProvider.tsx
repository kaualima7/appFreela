"use client";

// Mantém a lista de likes do cliente disponível para as telas da Web.
// Consulta /api/interests e envia as alterações para /api/services/:id/interest.

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { API_URL, interestError } from "@/app/api";
import { authenticatedFetch, getToken } from "@/app/login/auth_service";
import type { ClientInterest, PublicService } from "@/app/types/service";
import { useSession } from "./SessionProvider";

type InterestResult = { ok: boolean; error: string };
type InterestSnapshot = {
  clientUserId: number | null;
  version: number;
  interests: ClientInterest[];
  error: string;
};

const InterestsContext = createContext<{
  interests: ClientInterest[];
  loading: boolean;
  error: string;
  reload: () => void;
  isPending: (serviceId: number) => boolean;
  changeInterest: (
    service: PublicService,
    interested: boolean,
  ) => Promise<InterestResult>;
} | null>(null);

// Busca os likes da conta de cliente em GET /api/interests, usando o token da sessão.
async function readInterests(signal?: AbortSignal): Promise<ClientInterest[]> {
  const response = await authenticatedFetch(`${API_URL}/interests`, { signal });
  if (!response.ok)
    throw new Error(
      await interestError(
        response,
        "Não foi possível carregar seus likes. Tente novamente.",
      ),
    );
  const interests: ClientInterest[] | null = await response
    .json()
    .catch(() => null);
  if (!Array.isArray(interests))
    throw new Error(
      "Não foi possível carregar seus likes. Tente novamente.",
    );
  return interests;
}

export default function InterestsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { user, checking } = useSession();
  const clientUserId = user?.accountType === "CLIENT" ? user.id : null;
  const [version, setVersion] = useState(0);
  const requestedVersion = useRef(0);
  const [snapshot, setSnapshot] = useState<InterestSnapshot>({
    clientUserId: null,
    version: -1,
    interests: [],
    error: "",
  });
  const pendingOperations = useRef(new Set<string>());
  const [pendingKeys, setPendingKeys] = useState<string[]>([]);
  const mutationVersion = useRef(0);

  // Carrega a lista ao identificar o cliente e cancela o pedido quando a consulta deixa de ser necessária.
  useEffect(() => {
    if (clientUserId === null) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let active = true;
    const startedVersion = mutationVersion.current;
    async function load() {
      try {
        const interests = await readInterests(controller.signal);
        if (active && startedVersion === mutationVersion.current)
          setSnapshot({ clientUserId, version, interests, error: "" });
      } catch (error) {
        if (active && startedVersion === mutationVersion.current)
          setSnapshot((previous) => ({
            clientUserId,
            version,
            interests:
              previous.clientUserId === clientUserId ? previous.interests : [],
            error:
              error instanceof Error &&
              !(error instanceof TypeError) &&
              error.name !== "AbortError"
                ? error.message
                : "Não foi possível carregar seus likes. Tente novamente.",
          }));
      } finally {
        clearTimeout(timeout);
      }
    }
    void load();
    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [clientUserId, version]);

  //like 2: envia POST para registrar ou DELETE para retirar em /api/services/:id/interest; depois atualiza os likes na tela
  async function changeInterest(
    service: PublicService,
    interested: boolean,
  ): Promise<InterestResult> {
    if (clientUserId === null)
      return {
        ok: false,
        error: "Entre com uma conta de cliente para dar like.",
      };
    const operationKey = `${clientUserId}:${service.id}`;
    if (pendingOperations.current.has(operationKey))
      return { ok: false, error: "Aguarde a operação em andamento." };
    pendingOperations.current.add(operationKey);
    setPendingKeys((previous) => [...previous, operationKey]);
    const token = getToken();
    try {
      const response = await authenticatedFetch(
        `${API_URL}/services/${service.id}/interest`,
        { method: interested ? "POST" : "DELETE" },
      );
      if (getToken() !== token)
        return { ok: false, error: "Sua sessão mudou. Entre novamente." };

      if (response.status === 409 || response.status === 404) {
        const message =
          response.status === 404
            ? await interestError(
                response,
                "Serviço ou like indisponível.",
              )
            : "Não foi possível sincronizar o like. Tente novamente.";
        let syncVersion: number;
        let interests: ClientInterest[];
        // Se outro like mudou durante a consulta, buscamos o estado atual.
        do {
          syncVersion = mutationVersion.current;
          interests = await readInterests();
        } while (
          syncVersion !== mutationVersion.current &&
          getToken() === token
        );
        if (getToken() !== token)
          return { ok: false, error: "Sua sessão mudou. Entre novamente." };
        mutationVersion.current += 1;
        setSnapshot({
          clientUserId,
          version: requestedVersion.current,
          interests,
          error: "",
        });
        return {
          ok:
            response.status === 409 &&
            interests.some((interest) => interest.serviceId === service.id),
          error: message,
        };
      }
      if (!response.ok)
        return {
          ok: false,
          error: await interestError(
            response,
            "Não foi possível atualizar o like. Tente novamente.",
          ),
        };

      const createdInterest: {
        id: number;
        serviceId: number;
        createdAt: string;
      } | null = interested ? await response.json() : null;
      if (getToken() !== token)
        return { ok: false, error: "Sua sessão mudou. Entre novamente." };
      mutationVersion.current += 1;
      // Atualiza a lista compartilhada depois da confirmação da API para refletir o like em todas as telas.
      setSnapshot((previous) => {
        const remaining =
          previous.clientUserId === clientUserId
            ? previous.interests.filter(
                (interest) => interest.serviceId !== service.id,
              )
            : [];
        return {
          clientUserId,
          version: requestedVersion.current,
          error: "",
          interests: createdInterest
            ? [
                {
                  id: createdInterest.id,
                  serviceId: createdInterest.serviceId,
                  createdAt: createdInterest.createdAt,
                  service: { ...service, published: true },
                },
                ...remaining,
              ]
            : remaining,
        };
      });
      return { ok: true, error: "" };
    } catch {
      return {
        ok: false,
        error:
          "Não foi possível atualizar o like. Verifique sua conexão e tente novamente.",
      };
    } finally {
      pendingOperations.current.delete(operationKey);
      setPendingKeys((previous) =>
        previous.filter((key) => key !== operationKey),
      );
    }
  }

  const sameClient = snapshot.clientUserId === clientUserId;
  return (
    <InterestsContext.Provider
      value={{
        interests:
          sameClient && clientUserId !== null ? snapshot.interests : [],
        loading:
          checking ||
          (clientUserId !== null &&
            (!sameClient || snapshot.version !== version)),
        error: sameClient && clientUserId !== null ? snapshot.error : "",
        reload: () => {
          requestedVersion.current += 1;
          setVersion(requestedVersion.current);
        },
        isPending: (serviceId) =>
          pendingKeys.includes(`${clientUserId}:${serviceId}`),
        changeInterest,
      }}
    >
      {children}
    </InterestsContext.Provider>
  );
}

// Permite que os componentes consultem a lista de likes e usem as ações compartilhadas.
export function useInterests() {
  const interests = useContext(InterestsContext);
  if (!interests) throw new Error("Interesses não inicializados.");
  return interests;
}
