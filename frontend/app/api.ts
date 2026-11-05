export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export async function responseError(response: Response, fallback: string): Promise<string> {
    const data = await response.json().catch(() => null);
    if (Array.isArray(data?.message)) return data.message.join(" ");
    return typeof data?.message === "string" ? data.message : fallback;
}
