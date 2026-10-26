export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public fieldErrors: Record<string, string> = {},
  ) {
    super(message);
  }
}

export async function apiRequest<T = unknown>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const response = await fetch(path, {
    method: init.method ?? "GET",
    headers: init.body === undefined ? undefined : { "Content-Type": "application/json" },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string; fieldErrors?: Record<string, string> };
    throw new ApiClientError(data.error ?? "Algo deu errado. Tente de novo.", response.status, data.fieldErrors);
  }
  return (response.status === 204 ? undefined : await response.json()) as T;
}
