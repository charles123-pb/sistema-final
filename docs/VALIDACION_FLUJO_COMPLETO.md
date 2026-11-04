# Flujo clínico y permisos — 6 de octubre de 2026

**Documento histórico:** incluye recorridos y referencias al copiloto previo a su retiro del 29 de octubre de 2026. No implica que el módulo siga disponible.

## Perfil del consultorio

Se conserva la cuenta del propietario con los roles **ADMINISTRADOR + ODONTOLOGO**,
como dueño y único trabajador actual. No se crearon, desactivaron ni cambiaron cuentas,
roles o permisos. Los perfiles adicionales existentes se mantienen disponibles.

## Antes y después

| Nivel | Archivo / ubicación | Antes y consecuencia | Después y riesgo |
|---|---|---|---|
| Alto | `agenda.ts`, apertura, guardado y cambio de estado | Las acciones visibles dependían del permiso, pero sus métodos podían invocarse sin comprobar `CITA_ESCRIBIR`. | Comprobación antes de escrituras y diálogos. Se mantienen las reglas del backend. Riesgo bajo; pruebas de llamadas directas sin permiso. |
| Medio | `agenda.ts` / `.html`, acciones de la cita | Un odontólogo sin permiso de modificar citas no veía el acceso para abrir la atención. Recepción podía ver un acceso clínico que su rol no autorizaba. | Acceso clínico separado de escritura de citas; la ruta sigue protegida por `CLINICA_LEER` y el inicio por `CLINICA_ESCRIBIR`. La cuenta del dueño conserva ambas capacidades. Riesgo bajo. |
| Medio | `agenda.ts`, cierre, nueva cita y rutas | Un borrador de cita podía perderse al cerrar, reemplazarlo o salir. | Confirmación de descarte y protección de recarga/guardado. Riesgo bajo; cancelar conserva texto y horario. |
| Medio | `payment-agreement.ts`, `reload` / `openPayment` | Una actualización o reapertura podía borrar importe/firma pendientes. | Usa la misma protección de borradores antes de continuar. También rechaza importes no finitos. Riesgo bajo; pruebas y navegador. |
| Medio | `admin-center.ts` / `.html`, usuario, configuración y contraseña | Cierre/salida podían perder formularios; refrescar otros datos reemplazaba valores de configuración pendientes. | Confirmación de cierre y protección de ruta/recarga; se conservan los valores modificados cuando se refresca la información. Riesgo bajo; no cambia permisos ni contratos. |
| Medio | `copilot-workspace.ts` / `.html`, edición y conversación | Cambiar de atención, salir o reiniciar podía descartar correcciones o un mensaje sin enviar. | Protección de borradores y mensajes; exige guardar/cancelar correcciones antes de aprobar o generar otro borrador. Se conserva la posibilidad de reiniciar conversaciones y descartar respuestas tardías. Riesgo bajo; pruebas de regresión. |

## Recorrido real comprobado

Supabase corresponde al entorno que el usuario confirmó como **solo datos de prueba**.
Se utilizó su cuenta autorizada. Las firmas son trazos de simulación sobre un paciente
sintético identificado como prueba; no corresponden a intervenciones ni cobros reales.

1. Se creó un paciente sintético sin teléfono, correo ni consentimiento WhatsApp.
2. Se creó y confirmó una cita y se registró su llegada mediante los RPC existentes.
3. Desde Chromium se inició la atención vinculada a esa cita y se guardó la historia,
   con campos identificados como simulación técnica sin intervención real.
4. Se creó y aprobó un odontograma desde la interfaz.
5. Se creó un plan de consulta de S/50, se presentó y se firmó desde la interfaz.
   La copia del presupuesto se recuperó nuevamente desde Supabase.
6. Se registró un abono firmado de S/10 desde la interfaz. Se comprobaron su constancia,
   firma persistida y saldo de S/40.
7. Se finalizó la historia desde la interfaz. Tras recargar, quedó de solo lectura;
   Supabase también cambió la cita a COMPLETADA.
8. El enlace Agendar control conservó paciente, odontólogo y fecha indicada. Se creó
   el control del 7 de octubre de 2026 desde la agenda.
9. Se anuló el cobro de simulación desde Finanzas: volvió el saldo a S/50 y el pagado
   a cero. La constancia original y su firma se conservaron como ANULADO.

Registros conservados: paciente **6**, cita **12**, atención **7**, odontograma **8**,
plan **7**, cuenta **2**, pago **2** (anulado), control **13**.
Marca: `PRUEBA-FLUJO-20261006-1791279645342`.
No se eliminaron registros ni se aplicaron migraciones. Se utilizó la caja abierta
existente del entorno de prueba; no se abrió ni cerró ninguna caja durante el recorrido.

## Permisos y comprobaciones de seguridad

- Catálogo de roles consultado con la cuenta autorizada: ADMINISTRADOR, ODONTOLOGO,
  RECEPCION y CAJA. El perfil combinado del propietario se conserva.
- Se comprobó que Supabase rechaza sin sesión las consultas `obtener_atencion`,
  `obtener_cita`, `obtener_plan`, `obtener_acuerdo_presupuesto`, `obtener_acuerdo_pago`
  y `listar_cuentas`, con código `42501`.
- Doce pruebas del guard cubren acceso y rechazo de rutas por subconjuntos de permisos
  de lectura del catálogo. Estas pruebas usan dobles; no simulan sesiones reales de otros roles.
- Sin cuentas separadas disponibles, **no se certifica la matriz completa de permisos
  por rol en el servidor**, ni aislamiento entre clínicas, RLS, Storage o funciones SQL.

## Verificación

- `npm run validate`: linter, tipos, **262 pruebas en 41 archivos** y build aprobados.
- Paquete inicial de producción: 530,20 kB; se mantiene dentro del presupuesto configurado.
  Este tamaño no equivale a una medición de rendimiento con grandes volúmenes de pacientes.
- Chromium autenticado: recorrido clínico, presupuesto, pago, anulación y control;
  sin excepciones de página en las comprobaciones realizadas.
- Chromium autenticado: cancelar cierre/salida de Administración conserva el formulario;
  reiniciar/salir de DentalIA conserva el mensaje pendiente; cancelar el cierre del pago
  conserva importe y firma. Sin errores de consola; sin crear cuentas ni enviar consultas IA.
- Nombres y orden de rutas conservados; sin archivos originales eliminados.
- Imagen Docker `dental-americana:flujo-validado` compilada con las correcciones;
  `nginx -t` aprobado. Se conserva la imagen previa.
- Sin despliegue externo. El build local incorpora las correcciones.

## Archivos de esta revisión

- `src/app/app.routes.ts`: guardas de borrador en agenda, administración y DentalIA;
  se mantienen rutas y permisos existentes.
- `src/app/core/auth/permission.guard.spec.ts`: matriz de guardas por permisos de lectura.
- `agenda.ts`, `.html`, `.spec.ts`: permisos, acceso clínico y protección de borradores.
- `payment-agreement.ts`, `.spec.ts`: conservación de firma/importe y validación numérica.
- `admin-center.ts`, `.html`, `.spec.ts`: protección de formularios y configuración pendiente.
- `copilot-workspace.ts`, `.html`, `.spec.ts`: protección de edición y mensajes sin enviar.
- Informes y README: resultados conectados, perfil del propietario y pendientes actualizados.

## Pendientes conservados

- Simbología y estados clínicos del odontograma según NTS 188: requiere validación clínica
  y campos adicionales; no se transformaron automáticamente colores ni hallazgos existentes.
- Rendimiento a gran escala e índices: requiere mediciones y acceso a migraciones.
- Backend completo: no está incluido en esta copia. No se modificaron SQL/RLS/relaciones.
- Separación de prueba/producción, respaldo y recuperación del servidor: falta identificar
  alojamiento y administración de respaldos. No se ejecutó una restauración.
- WhatsApp, IA externa y comprobantes tributarios no forman parte de este recorrido;
  se mantienen sus integraciones y no se enviaron comunicaciones.
