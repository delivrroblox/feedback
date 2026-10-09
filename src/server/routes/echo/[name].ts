export async function GET(_req: Request, params?: Record<string, string>) {
  return Response.json({ echo: params?.name ?? null });
}
