import { GHL, parseRequest, pinMatches, runCodigoRojo } from "../../lib/codigo-rojo.mjs";

// Variables en Netlify: GHL_TOKEN, GHL_LOCATION_ID, GHL_USER_ID, CODIGO_ROJO_PIN.
export default async (request: Request) => {
  if (request.method !== "POST") return Response.json({ error: "Método no permitido" }, { status: 405 });
  const env = Netlify.env;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }
  if (!pinMatches(body.pin as string, env.get("CODIGO_ROJO_PIN") ?? "")) {
    return Response.json({ error: "PIN incorrecto" }, { status: 401 });
  }
  try {
    const ghl = new GHL({ token: env.get("GHL_TOKEN"), locationId: env.get("GHL_LOCATION_ID") });
    const result = await runCodigoRojo(ghl, env.get("GHL_USER_ID"), parseRequest(body));
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
};

export const config = { path: "/api/codigo-rojo" };
