# DentalIA con número propio — 6 de octubre de 2026

**Documento histórico:** el bot de WhatsApp y el módulo copiloto se retiraron el 29 de octubre de 2026. El consultorio usa un solo número para pacientes y seguimientos; no se borraron sus tablas ni registros. No seguir estos pasos para activar DentalIA. Véase [WhatsApp con un número](WHATSAPP_UN_NUMERO.md).

El modo solicitado queda preparado y desplegado, pero **no está conectado**: el usuario confirmó que todavía no tiene el segundo número de WhatsApp.

## Cómo funcionará

- El dueño usa el WhatsApp de la clínica, conectado a Seguimientos.
- DentalIA usa un segundo número exclusivo, con una conexión independiente.
- Desde el WhatsApp de la clínica, el dueño abre el contacto DentalIA y pregunta por agenda, cobros, saldos y seguimientos.
- El nombre del contacto se puede guardar como DentalIA. No se crea un contacto ni se compra un número automáticamente.

No es necesario usar el número personal del dueño para este modo. La modalidad anterior continúa disponible en el selector «Modo anterior» y conserva su número preparado y sus funciones.

## Pasos cuando se disponga del segundo número

1. Abrir Seguimientos → DentalIA privado → Número propio de DentalIA (seleccionado por defecto).
2. Ingresar el segundo número y generar su QR. Escanearlo desde el WhatsApp de ese segundo número, no desde el WhatsApp de la clínica.
3. En «Número de la clínica autorizado para consultar», comprobar el número conectado a Seguimientos y generar el comando de vinculación.
4. Desde el WhatsApp de la clínica, enviar ese comando al contacto DentalIA y esperar la confirmación.
5. Preguntar en ese chat. Las consultas disponibles y sus límites siguen descritos en `DENTALIA_WHATSAPP_PRIVADO.md`.

## Cambios

Se añadió una conexión independiente `dentalia-asistente`, configurada mediante el secreto de servidor `DENTALIA_EVOLUTION_INSTANCE_NAME`. La instancia se crea en Evolution únicamente al solicitar un QR con un segundo número válido; no se creó ni vinculó durante este trabajo.

La migración aditiva `202610060002_dentalia_dedicated_number.sql` agrega estado, vínculos y registro de consultas separados, y RPC específicas para el nuevo modo. Las funciones anteriores mantienen sus nombres y contratos. Se reutilizan autorización, clasificación, formato de respuestas y adaptador Evolution.

La nueva función `dentalia-whatsapp-session` comprueba la sesión, IA_LEER y el rol administrador antes de consultar o preparar la conexión. Rechaza números vacíos o iguales al número de la clínica. El webhook reconoce ambas instancias y conserva el soporte anterior de pacientes y Meta.

Los desconocidos que escriban al número de DentalIA no pasan al sistema de pacientes. Los mensajes provenientes del número propio del bot se excluyen de las automatizaciones de pacientes en la clínica, evitando respuestas automáticas entre los dos números. La verificación de posesión, caducidad, permisos por consulta, deduplicación y límite de frecuencia se mantienen.

Archivos principales: componente `dentalia-whatsapp-access`, `messaging-api.service.ts`, adaptadores `_shared/whatsapp.ts` y `_shared/dentalia-whatsapp.ts`, `whatsapp-webhook/handler.ts`, nueva función `dentalia-whatsapp-session`, migración 002, configuración Supabase y pruebas de la nueva modalidad. No se eliminaron módulos, rutas, permisos, roles ni registros existentes.

## Verificación y pendiente

- Linter, tipos y build del frontend: correctos; 266 tests en 42 archivos. Permanece el aviso anterior de CSS de Seguimientos (23 kB, por debajo del límite de error de 24 kB).
- Deno: tipos y linter correctos; 15 tests aprobados, incluido el aislamiento de desconocidos en el número propio.
- SQL: migración y pruebas de permisos, tokens, deduplicación, importes y límites comprobadas con rollback antes del despliegue.
- Servidor real: nuevo estado inaccesible para anon; estado autorizado DESCONECTADO; QR con número vacío rechazado; vínculo anterior conservado.
- Chromium: nuevo modo predeterminado, QR bloqueado sin segundo número, modo anterior disponible, móvil sin desbordamiento y conexión original conservada. Cero errores JavaScript registrados y cero mensajes enviados.
- Vista local actualizada: http://localhost:4173/sistema/seguimientos. Imagen `dental-americana:dentalia-numero-propio`; contenedor anterior conservado detenido como `dental-americana-dentalia-personal-preview-anterior`. Nginx válido.

Pendiente: disponer del segundo número, vincular los teléfonos y verificar envío/recepción real. El túnel de Evolution sigue siendo temporal. No se verificaron conversaciones reales entre los teléfonos ni se publicaron cambios del frontend en un dominio externo.
