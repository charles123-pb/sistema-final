import { corsHeaders, json } from "../_shared/http.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  return json({ message: "La integración de DentalIA por WhatsApp fue retirada." }, 410);
});
