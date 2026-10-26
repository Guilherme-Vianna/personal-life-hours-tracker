import { z } from "zod";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fieldErrors?: Record<string, string>,
  ) {
    super(message);
  }
}

export function notFound(what: string) {
  return new ApiError(404, `${what} não encontrado(a)`);
}

export async function handle(run: () => Promise<unknown>, successStatus = 200) {
  try {
    const result = await run();
    if (result === undefined) return new Response(null, { status: 204 });
    return Response.json(result, { status: successStatus });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of error.issues) fieldErrors[issue.path.join(".") || "_"] ??= issue.message;
      return Response.json({ error: "Dados inválidos", fieldErrors }, { status: 422 });
    }
    if (error instanceof ApiError) {
      return Response.json({ error: error.message, fieldErrors: error.fieldErrors }, { status: error.status });
    }
    if (error instanceof SyntaxError) return Response.json({ error: "JSON inválido" }, { status: 400 });
    console.error(error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
}

export function isUniqueViolation(error: unknown) {
  const code = (error as { code?: string; cause?: { code?: string } })?.code ?? (error as { cause?: { code?: string } })?.cause?.code;
  return code === "23505";
}
