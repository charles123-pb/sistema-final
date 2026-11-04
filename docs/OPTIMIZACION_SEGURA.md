# Optimización segura — 5 de octubre de 2026

**Registro histórico:** describe el alcance anterior al retiro de DentalIA del 29 de octubre de 2026; las menciones a sus módulos y funciones no reflejan el estado actual.

## Conservación

No se eliminaron módulos, pantallas, rutas, endpoints, funciones públicas, tablas, columnas, relaciones,
roles ni integraciones. Se conservaron todas las dependencias directas originales. Los dos imports
retirados estaban sin uso según TypeScript; sus funciones y modelos siguen presentes.
Tras autorización expresa se crearon y conservaron registros de prueba en el proyecto Supabase
identificado por el usuario como entorno de pruebas; se comprobaron guardados y aprobación clínica.
No se realizaron migraciones ni despliegues en producción.

## Antes y después

| Antes | Después |
|---|---|
| 7 paquetes afectados por avisos npm | 0 vulnerabilidades reportadas en auditoría completa y de producción |
| Sin linter ni comando de tipos | ESLint para TS/HTML y `npm run typecheck` |
| 182 pruebas / 34 archivos | 262 pruebas / 41 archivos, todas aprobadas |
| Error de consulta de alergias mostrado como cero | Estado explícito de alertas no disponibles; respeta acceso clínico |
| Perfil tardío podía aplicarse tras logout | Respuestas de sesiones anteriores descartadas y rechazos manejados |
| Un gasto reintentado recibía otro identificador | Identificador conservado para mismos datos y caja dentro de la pantalla |
| Error genérico si fallaba lectura tras guardar | Mensaje que distingue guardado exitoso y actualización pendiente |
| Búsqueda/ficha/informe podían conservar paciente anterior | Parámetros observados y respuestas obsoletas descartadas |
| Registro de pacientes sin protección de salida | Guard de navegación y protección de recarga/cierre |
| Varias lecturas de WhatsApp sin límite explícito | Límites de lectura y bloqueo de refrescos tras destrucción |
| Mensaje nuevo sin máximo uniforme | Mismo límite de 4.000 caracteres que el chat |
| Acciones de solicitudes visibles para lectura | Operaciones protegidas con permiso existente CITA_ESCRIBIR |
| Nginx podía perder cabeceras en recursos estáticos | Cabeceras explícitas y caché acorde al versionado |
| Build Docker fallaba con heap de 1.536 MB | Límite de compilación de 3.072 MB; compilación validada en Node 22 |

La idempotencia de gastos se conserva en memoria y para reintentos equivalentes; no garantiza
recuperación después de recargar el navegador. La protección definitiva depende del servidor.
El diagnóstico de conexión no sustituye login ni comprobaciones de permisos/RLS.

## Verificaciones

- `npm run lint`: correcto.
- `npm run typecheck`: correcto.
- `npm run test:ci -- --coverage=false`: 262 pruebas aprobadas en 41 archivos.
- Build de producción local y compilación Docker en Node 22: correctos. Imagen local preparada: `dental-americana:audit`, sin despliegue.
- `npm audit` y auditoría de producción: cero vulnerabilidades reportadas.
- `nginx -t` con imagen Nginx 1.30: correcto.
- Chromium real: portada, login y 15 rutas protegidas verificadas sin sesión; redirecciones correctas.
- Consola del navegador sin errores en ese recorrido. Portada móvil a 390 px sin desbordamiento horizontal.
- Cabeceras HTTP y caché de JavaScript versionado e imagen WebP comprobadas sobre Nginx.
- Posteriormente se verificaron pantallas autenticadas, guardados de prueba, aprobación y finalización,
  navegación con borradores y diseño móvil. Detalle en `REVISION_ATENCION.md`,
  `FLUJO_CLINICO_GUIADO.md` y `MEJORA_DISENO_ODONTOGRAMA.md`.
- Comparación de nombres y orden de rutas con HEAD: todas conservadas.
- Nombres de RPC y Edge Functions utilizados por el frontend: conservados.
- Comparación de dependencias directas con HEAD: todas conservadas.
- `git diff --check`: correcto. Ningún archivo original eliminado.

## Pendientes que requieren datos externos o decisión de flujo

1. **Conexión Supabase:** se incorporó la clave pública proporcionada en ambos entornos
   existentes. Auth `/auth/v1/settings` devuelve 200; una clave inválida de control devuelve 401.
   El 401 de la raíz PostgREST indica `Secret API key required`, no una clave pública inválida.
   Se corrigió el diagnóstico anterior. Login y operaciones clínicas se validaron posteriormente
   con la cuenta autorizada y registros de prueba. La comprobación exhaustiva de RLS sigue pendiente.
2. **Separación de entornos:** desarrollo y producción siguen conectados al mismo proyecto.
   Falta identificar cada entorno y sus migraciones/integraciones antes de separarlos.
3. **Backend ausente:** revisar migraciones, RLS, grants, claves foráneas, índices, RPC, Storage,
   Edge Functions, CORS, webhooks, WhatsApp e IA. No se certificaron ni modificaron esos servicios.
4. **Prueba funcional conectada:** login, atención, odontograma, presupuesto firmado,
   abono firmado, cierre, control y anulación del cobro de prueba comprobados.
   Gastos, WhatsApp y la matriz completa de permisos por rol requieren validación adicional.
5. **Vinculación automática de solicitudes:** no se cambió el criterio de selección de identidad;
   requiere acordar cuándo exigir confirmación para teléfonos compartidos/coincidencias parciales.
6. **Administración:** no se inventaron permisos de escritura que no estén definidos en el backend;
   revisar contratos de autorización antes de ajustar estos controles.
7. **Esquema tipado:** generar tipos completos desde la base autorizada antes de sustituir casts.
8. **Optimización estructural:** dividir archivos extensos, paginar listados y optimizar índices
   después de contar con mediciones y pruebas conectadas. No se cambiaron zonas horarias ni CSP
   sin validar su impacto.
9. **Borradores adicionales: corregidos.** Agenda, Administración, DentalIA y
   reapertura/actualización de pagos cuentan con protección de cambios pendientes.
   Se conservan formularios y configuración modificada; pruebas y navegador verificados.

## Archivos modificados o agregados

| Archivo | Motivo |
|---|---|
| `.gitignore` | Evitar incorporar credenciales locales accidentalmente. |
| `Dockerfile` | Corregir el límite de memoria que hacía fallar la compilación en Node 22. |
| `README.md` | Documentar verificaciones y límites del diagnóstico de conexión. |
| `eslint.config.mjs` | Linter de TypeScript y plantillas Angular. |
| `nginx.conf` | Cabeceras de seguridad y caché diferenciada para recursos versionados y nombres estables. |
| `package-lock.json` | Actualizaciones compatibles de dependencias y comandos de lint, tipos y diagnóstico. |
| `package.json` | Actualizaciones compatibles de dependencias y comandos de lint, tipos y diagnóstico. |
| `scripts/check-supabase.mjs` | Diagnóstico sin escrituras ni lectura de pacientes; no muestra claves. |
| `src/app/app.routes.ts` | Agregar protección de cambios pendientes en registro, edición y ficha de pacientes; conservar rutas. |
| `src/app/core/auth/auth.service.spec.ts` | Pruebas de regresión y adaptación de dobles a las mejoras de navegación/seguridad. |
| `src/app/core/auth/auth.service.ts` | Ignorar perfiles de sesiones anteriores y manejar errores de carga del contexto. |
| `src/app/core/supabase/supabase-api.service.spec.ts` | Pruebas de regresión y adaptación de dobles a las mejoras de navegación/seguridad. |
| `src/app/core/supabase/supabase-api.service.ts` | Diferir llamadas hasta la suscripción y distinguir escritura exitosa de fallo al refrescar. |
| `src/app/core/supabase/supabase-error.service.ts` | Informar claramente una configuración pública de conexión inválida. |
| `src/app/features/appointments/data-access/appointment-api.service.ts` | Comunicar fallos de lectura posteriores a una escritura confirmada sin repetir la mutación. |
| `src/app/features/appointments/pages/booking-requests/booking-requests.html` | Aplicar CITA_ESCRIBIR a acciones de escritura sin alterar permisos del servidor. |
| `src/app/features/appointments/pages/booking-requests/booking-requests.spec.ts` | Pruebas de regresión y adaptación de dobles a las mejoras de navegación/seguridad. |
| `src/app/features/appointments/pages/booking-requests/booking-requests.ts` | Aplicar CITA_ESCRIBIR a acciones de escritura sin alterar permisos del servidor. |
| `src/app/features/clinical/data-access/clinical-api.service.ts` | Comunicar fallos de lectura posteriores a una escritura confirmada sin repetir la mutación. |
| `src/app/features/finance/pages/finance-dashboard/finance-dashboard.spec.ts` | Pruebas de regresión y adaptación de dobles a las mejoras de navegación/seguridad. |
| `src/app/features/finance/pages/finance-dashboard/finance-dashboard.ts` | Conservar el identificador de gasto durante reintentos equivalentes y validar importes obligatorios. |
| `src/app/features/login/login.spec.ts` | Pruebas de regresión y adaptación de dobles a las mejoras de navegación/seguridad. |
| `src/app/features/login/login.ts` | Evitar solicitudes simultáneas de acceso. |
| `src/app/features/messaging/data-access/messaging-api.service.spec.ts` | Pruebas de regresión y adaptación de dobles a las mejoras de navegación/seguridad. |
| `src/app/features/messaging/data-access/messaging-api.service.ts` | Aceptar respuesta vacía de una operación cuyo contrato local es void. |
| `src/app/features/messaging/pages/follow-up-center/follow-up-center.spec.ts` | Pruebas de regresión y adaptación de dobles a las mejoras de navegación/seguridad. |
| `src/app/features/messaging/pages/follow-up-center/follow-up-center.ts` | Impedir refrescos tras destrucción, limitar lecturas y validar longitud del mensaje nuevo. |
| `src/app/features/odontogram/data-access/odontogram-api.service.ts` | Comunicar fallos de lectura posteriores a una escritura confirmada sin repetir la mutación. |
| `src/app/features/patients/data-access/patient-api.service.spec.ts` | Pruebas de regresión y adaptación de dobles a las mejoras de navegación/seguridad. |
| `src/app/features/patients/data-access/patient-api.service.ts` | Distinguir alertas desconocidas y diferir operaciones hasta su suscripción. |
| `src/app/features/patients/models/patient.models.ts` | Añadir disponibilidad opcional del conteo de alergias, conservando propiedades previas. |
| `src/app/features/patients/pages/patient-clinical-report/patient-clinical-report.spec.ts` | Pruebas de regresión y adaptación de dobles a las mejoras de navegación/seguridad. |
| `src/app/features/patients/pages/patient-clinical-report/patient-clinical-report.ts` | Actualizar la ficha/informe al cambiar de paciente e ignorar respuestas anteriores. |
| `src/app/features/patients/pages/patient-detail/patient-detail.spec.ts` | Pruebas de regresión y adaptación de dobles a las mejoras de navegación/seguridad. |
| `src/app/features/patients/pages/patient-detail/patient-detail.ts` | Actualizar la ficha/informe al cambiar de paciente e ignorar respuestas anteriores. |
| `src/app/features/patients/pages/patient-form/patient-form.html` | Proteger borradores, validar nacimiento y gestionar cambios de paciente en la ruta. |
| `src/app/features/patients/pages/patient-form/patient-form.ts` | Proteger borradores, validar nacimiento y gestionar cambios de paciente en la ruta. |
| `src/app/features/patients/pages/patient-list/patient-list.html` | Actualizar búsquedas desde la URL y mostrar cuando las alertas no están disponibles. |
| `src/app/features/patients/pages/patient-list/patient-list.spec.ts` | Pruebas de regresión y adaptación de dobles a las mejoras de navegación/seguridad. |
| `src/app/features/patients/pages/patient-list/patient-list.ts` | Actualizar búsquedas desde la URL y mostrar cuando las alertas no están disponibles. |
| `src/app/features/treatments/data-access/treatment-api.service.ts` | Comunicar fallos de lectura posteriores a una escritura confirmada sin repetir la mutación. |
| `src/app/features/treatments/pages/treatment-plan/treatment-plan.ts` | Corregir dos imports demostrados sin uso; conservar funciones y modelos originales. |
| `src/app/shared/validation/date.validators.spec.ts` | Pruebas de regresión y adaptación de dobles a las mejoras de navegación/seguridad. |
| `src/app/shared/validation/date.validators.ts` | Validación compartida de fechas reales y no futuras. |
| `docs/OPTIMIZACION_SEGURA.md` | Informe de comparación, verificaciones y pendientes. |
| `src/app/features/patients/pages/patient-form/patient-form.spec.ts` | Pruebas de guardas reales al cambiar de paciente y de protección al cerrar el navegador. |

## Actualización consolidada

`npm run validate` ejecuta linter, tipos, pruebas y compilación en secuencia y detiene
el proceso ante un fallo. Dependencias verificadas con el registro npm: no quedan
actualizaciones dentro de los rangos compatibles definidos. Las nuevas versiones
principales requieren migración y no se instalaron automáticamente.

### Comprobación de la actualización consolidada

- `npm run validate`: linter, tipos, 238 pruebas en 40 archivos y build de producción aprobados.
- `npm audit`: cero vulnerabilidades reportadas.
- `npm outdated --json`: versiones instaladas coinciden con las versiones compatibles permitidas.
- `npm run check:connection`: Auth 200; raíz PostgREST 401 con exigencia de clave secreta,
  sin sustituir la clave pública ni exponer credenciales.
- Imagen Docker reconstruida desde instalación limpia: `dental-americana:actualizado`.
- `nginx -t`: aprobado. Contenedor temporal: portada, login, atención, odontograma y
  pacientes sirven la aplicación Angular con HTTP 200 y cabeceras de seguridad.
  Este control HTTP verifica alojamiento SPA, no autorizaciones ni consultas clínicas.
- Rutas y dependencias directas originales conservadas; ningún archivo original eliminado.
- No se actualizó ningún servidor externo ni se aplicaron migraciones.

## Continuación — 6 de octubre de 2026

Se conserva el perfil del dueño con ADMINISTRADOR + ODONTOLOGO, único trabajador actual.
No se cambiaron cuentas, roles ni permisos. Se completó el recorrido conectado de prueba
con firma de presupuesto, abono firmado, cierre, control y anulación con conservación
de firma. La suite actual tiene 262 pruebas en 41 archivos. Se corrigieron permisos de
acciones de agenda y protección de borradores en agenda, pagos, Administración y DentalIA.
Resultados, registros conservados y límites en `VALIDACION_FLUJO_COMPLETO.md`.
