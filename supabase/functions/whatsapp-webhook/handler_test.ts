import {
  handleWebhook,
  unwrapMessage,
  verifyMetaSignature,
} from "./handler.ts";
import { serviceClient } from "../_shared/client.ts";
const check = (ok: boolean, message: string) => {
  if (!ok) throw new Error(message);
};
const secret = "test-only-webhook-secret-with-enough-length";
const original = Deno.env.get("EVOLUTION_WEBHOOK_SECRET");
Deno.env.set("EVOLUTION_WEBHOOK_SECRET", secret);
function request(data: unknown, event = "messages.upsert", token = secret) {
  return new Request("https://test.invalid/webhook", {
    method: "POST",
    headers: { "x-webhook-secret": token },
    body: JSON.stringify({ event, data }),
  });
}
const client = () =>
  ({
    rpc: async () => ({ error: null, data: null }),
    from: () => ({
      select: () => ({ in: async () => ({ error: null, data: [] }) }),
    }),
  }) as unknown as ReturnType<typeof serviceClient>;
Deno.test("webhook inválido se rechaza antes de consultar o responder", async () => {
  let called = false;
  const result = await handleWebhook(
    request({}, "messages.upsert", "bad"),
    () => {
      called = true;
      return client();
    },
  );
  check(result.status === 401 && !called, "No consultar sin secreto válido");
});
Deno.test("los pacientes conservan la ruta pasiva y el contexto cuando no son el dueño", async () => {
  let received: any;
  let rpcName = "";
  const c = client();
  c.rpc = ((name: string, args: any) => {
    rpcName = name;
    received = args;
    return Promise.resolve({ error: null, data: null });
  }) as any;
  const result = await handleWebhook(
    request({
      key: { id: "patient-test", remoteJid: "51999111222@s.whatsapp.net" },
      message: {
        extendedTextMessage: {
          text: "CONFIRMO",
          contextInfo: { stanzaId: "appointment-context" },
        },
      },
    }),
    () => c,
  );
  check(
    result.status === 200 && rpcName === "registrar_evento_whatsapp_pasivo" &&
      received.datos.contextProviderId === "appointment-context",
    "Mantener ruta de pacientes",
  );
});
Deno.test("se ignoran grupos y mensajes propios", async () => {
  let calls = 0;
  const c = client();
  c.rpc = (() => {
    calls++;
    return Promise.resolve({ error: null, data: null });
  }) as any;
  for (
    const key of [{ fromMe: true, remoteJid: "51999111222@s.whatsapp.net" }, {
      remoteJid: "123@g.us",
    }]
  ) {
    const result = await handleWebhook(
      request({
        key: { id: "test", ...key },
        message: { conversation: "Resumen" },
      }),
      () => c,
    );
    check(result.status === 200, "Evento ignorado");
  }
  check(calls === 0, "Los eventos ignorados no deben llegar al registro de pacientes");
});
Deno.test("se conserva el desempaquetado de mensajes efímeros y se rechaza una firma Meta incorrecta", async () => {
  check(
    unwrapMessage({ ephemeralMessage: { message: { conversation: "hola" } } })
      .conversation === "hola",
    "Conservar mensajes envueltos",
  );
  check(
    !await verifyMetaSignature(
      "{}",
      "sha256=" + "0".repeat(64),
      "test-app-secret",
    ),
    "Firma inválida",
  );
});

Deno.test("restaurar secreto del entorno de prueba", () => {
  if (original === undefined) Deno.env.delete("EVOLUTION_WEBHOOK_SECRET");
  else Deno.env.set("EVOLUTION_WEBHOOK_SECRET", original);
});
