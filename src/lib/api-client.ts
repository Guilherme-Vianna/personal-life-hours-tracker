export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public fieldErrors: Record<string, string> = {},
    public code?: string,
  ) {
    super(message);
  }
}

const WRITE_LOCKED_CODE = "write_locked";

type PinPrompt = (error?: string) => Promise<string | null>;
let promptForPin: PinPrompt | null = null;

export function registerPinPrompt(prompt: PinPrompt | null) {
  promptForPin = prompt;
}

async function send(path: string, init: { method?: string; body?: unknown }) {
  const response = await fetch(path, {
    method: init.method ?? "GET",
    headers: init.body === undefined ? undefined : { "Content-Type": "application/json" },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  if (response.ok) return response;
  const data = (await response.json().catch(() => ({}))) as { error?: string; fieldErrors?: Record<string, string>; code?: string };
  throw new ApiClientError(data.error ?? "Algo deu errado. Tente de novo.", response.status, data.fieldErrors, data.code);
}

async function unlock() {
  let error: string | undefined;
  while (promptForPin) {
    const pin = await promptForPin(error);
    if (pin === null) return false;
    try {
      await send("/api/auth/unlock", { method: "POST", body: { pin } });
      return true;
    } catch (err) {
      error = err instanceof ApiClientError ? err.message : "Não foi possível validar a senha.";
    }
  }
  return false;
}

export async function apiRequest<T = unknown>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  let response: Response;
  try {
    response = await send(path, init);
  } catch (error) {
    if (!(error instanceof ApiClientError) || error.code !== WRITE_LOCKED_CODE) throw error;
    if (!(await unlock())) throw new ApiClientError("Operação cancelada: senha não informada.", 401);
    response = await send(path, init);
  }
  return (response.status === 204 ? undefined : await response.json()) as T;
}
