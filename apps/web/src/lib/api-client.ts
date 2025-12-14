const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";

export interface ApiRequestOptions extends RequestInit {
  authToken?: string | null;
}

export async function apiRequest<T>(
  path: string,
  { authToken, headers, ...options }: ApiRequestOptions = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(headers ?? {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    credentials: "include",
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const errorMessage = typeof body.error === "string" ? body.error : response.statusText;
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

