# DentalIA privado por WhatsApp — 6 de octubre de 2026

**Documento histórico:** el bot de WhatsApp y el módulo copiloto se retiraron el 29 de octubre de 2026. El consultorio usa un solo número para pacientes y seguimientos; no se borraron sus tablas ni registros. No seguir estos pasos para activar DentalIA. Véase [WhatsApp con un número](WHATSAPP_UN_NUMERO.md).

**Actualización:** ahora se ofrece por defecto el modo con número propio de DentalIA, solicitado por el dueño. Está preparado y pendiente del segundo número; véase [Número propio de DentalIA](DENTALIA_NUMERO_PROPIO.md). La modalidad descrita abajo se conserva como «Modo anterior».

## Resultado

Se implementó y desplegó el soporte de un chat privado del administrador con DentalIA mediante la instancia Evolution existente. El número personal indicado por el usuario quedó preparado en la base de prueba, sin verificar todavía. El teléfono de la clínica sigue pendiente de vincularse físicamente.

En Seguimientos aparece **DentalIA privado** para cuentas con rol ADMINISTRADOR y permiso IA_LEER. El servidor comprueba nuevamente el rol activo, la cuenta activa/no bloqueada y los permisos vigentes para cada consulta. El administrador odontólogo conserva sus dos roles.

## Activación por el dueño

1. Vincular el WhatsApp de la clínica desde Seguimientos → Conectar WhatsApp.
2. Abrir DentalIA privado y comprobar el número personal registrado. Generar un código cuando ambos teléfonos estén listos.
3. Desde ese WhatsApp personal, enviar `VINCULAR DENTALIA <código>` al número de la clínica.
4. Esperar la confirmación del asistente y actualizar el estado dentro del sistema.
5. Preguntar desde el mismo chat, por ejemplo: «¿Qué citas tengo mañana?» o «¿Cuánto cobré hoy?».

El código es privado, vence en diez minutos y se usa una sola vez. El servidor almacena su hash, no el código. Al cerrar el diálogo, la interfaz descarta el comando temporal; se puede generar uno nuevo. No se realiza la verificación automáticamente ni se reemplaza la posesión del teléfono por una cuenta iniciada en el navegador.

## Consultas disponibles

- Agenda de hoy, ayer o mañana: cantidad y primeras diez citas no canceladas, con hora de Lima, nombre del paciente y estado.
- Cobros de hoy, ayer o mañana: total de pagos registrados, excluyendo anulaciones. No representa utilidad ni saldo de caja.
- Cuentas por cobrar: total y cantidad de cuentas con saldo, excluyendo anuladas.
- Seguimientos: alertas, respuestas pendientes, programados y enviados sin respuesta registrada.
- Pacientes: cantidad de activos y total de registros.
- Resumen del día: secciones permitidas de agenda, cobros y revisiones pendientes.

Esta primera versión resuelve consultas concretas con reglas y datos del sistema; no ofrece conversación generativa libre. Si no reconoce una petición, responde con las consultas disponibles. No genera diagnósticos ni envía historias, fotografías o documentos clínicos. No se envían preguntas ni datos a proveedores externos de IA.

Las consultas no escriben citas, pacientes, pagos, historias ni seguimientos. Únicamente se actualizan la vinculación y el registro operativo del bot.

## Protección y conservación

- El webhook conserva las funciones descargadas del servidor antes del cambio: flujos de citas, automatizaciones de pacientes, mensajes envueltos, firma y verificación de Meta, contexto citado y estados de entrega.
- DentalIA privado se intercepta en la entrada de Evolution; los eventos de Meta conservan su comportamiento previo.
- Números desconocidos mantienen el flujo de pacientes. Un número privado configurado pero no verificado, desactivado o sin permisos no obtiene información de empresa ni pasa al asistente de pacientes.
- No se responde a grupos, mensajes propios, cargas históricas o mensajes con antigüedad superior a cinco minutos.
- Cada identificador de mensaje/instancia puede reservar una sola respuesta. Los fallos ambiguos quedan registrados y no se reintentan automáticamente; el dueño puede enviar una consulta nueva.
- Límite de diez consultas reservadas por minuto y por usuario. No se almacenan el texto de la pregunta ni el contenido de la respuesta en el registro operativo.
- Las tablas nuevas tienen RLS y no admiten acceso directo de anon/authenticated. Las funciones de preparación/finalización solo son ejecutables por service_role, con comprobación adicional en el servidor.
- El botón Desactivar mi acceso revoca la vinculación conservando los registros.
- No se cambiaron ni eliminaron roles, permisos, endpoints, tablas o módulos existentes.

## Archivos y despliegue

- `src/app/features/messaging/components/dentalia-whatsapp-access/`: diálogo, verificación y controles de acceso del dueño.
- `messaging-api.service.ts`: RPC de estado y configuración, usando la sesión autenticada.
- `follow-up-center.ts/html/css`: acceso al diálogo y adaptación de acciones del encabezado.
- `supabase/migrations/202610060001_dentalia_private_whatsapp.sql`: dos tablas nuevas, RLS, índices y funciones de vinculación/consultas. Aplicada y registrada en el proyecto de prueba.
- `supabase/functions/whatsapp-webhook/`: copia de la función remota vigente, ampliada sin sustituirla por la copia antigua del otro directorio.
- `supabase/functions/_shared/dentalia-whatsapp.ts`: clasificación de consultas, formato y envío autorizado; utiliza el adaptador Evolution existente.
- `supabase/functions/_shared/auth.ts`, `client.ts`, `http.ts`: dependencias conservadas de la versión remota descargada; `whatsapp.ts` contiene el adaptador Evolution reutilizado.
- `supabase/tests/dentalia-private-whatsapp.sql` y pruebas TypeScript/Angular: controles de acceso, conservación de flujos y límites.
- `.gitignore`: excluye el estado temporal generado por Supabase CLI.

Se desplegó únicamente `whatsapp-webhook`, siguiendo el [despliegue de funciones de Supabase](https://supabase.com/docs/guides/functions/deploy). Se añadió el secreto de servidor `DENTALIA_WHATSAPP_ENABLED=true`. Las demás funciones y secretos existentes se conservaron.

Este directorio `supabase/` contiene el incremento y la función necesaria para este trabajo; no es un reemplazo del historial completo del backend. No usarlo para reiniciar la base ni desplegar indiscriminadamente todas las funciones. El backend histórico está en `/home/charles/Documentos/dental final/supabase/`.

Vista local: http://localhost:4173/sistema/seguimientos, imagen `dental-americana:dentalia-whatsapp`. El contenedor anterior se conserva detenido como `dental-americana-seguimientos-preview-anterior`. No se publicó el frontend en un dominio externo.

## Verificación

- Angular: linter y tipos correctos; 266 tests aprobados en 42 archivos; build correcto. Continúa el aviso previo de CSS de Seguimientos, 23 kB frente al objetivo de 22 kB, por debajo del límite de error de 24 kB.
- Backend: chequeo Deno y 14 tests aprobados; linter de los módulos de integración correcto, excluyendo `no-explicit-any` por los tipos existentes del payload del proveedor.
- SQL remoto: migración probada inicialmente con rollback; después, pruebas de token inválido/vencido/de un solo uso, usuario inexistente, deduplicación, fallo sin reintento, revocación, fechas de Lima, importes y límite de consultas ejecutadas con rollback.
- Acceso real: anon no puede consultar el estado; anon ni authenticated pueden ejecutar la RPC exclusiva del servidor. La cuenta real de prueba mantiene ADMINISTRADOR + ODONTOLOGO y pudo preparar el número.
- Chromium: generación del comando desde el diálogo, descarte al cerrar, reapertura sin mostrar el comando anterior, móvil de 390 px sin desbordamiento, diálogo original de conexión operativo y cero errores JavaScript registrados.
- Diagnóstico autenticado del webhook: soporte privado habilitado en modo READ_ONLY. Una prueba con código inválido del número preparado no produjo consultas privadas, respuestas ni registros de pacientes.
- Los conteos de citas, pagos, pacientes y mensajes permanecieron iguales antes/después de la prueba del webhook. El despachador conserva su estado activo. Nginx válido.

No se enviaron mensajes reales durante las comprobaciones. La recepción/envío desde los teléfonos y la confirmación real de vinculación permanecen pendientes. El túnel público de Evolution sigue siendo temporal, según el informe de reparación de WhatsApp.
