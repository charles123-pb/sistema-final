# Sistema Web Integral Dental Americana — Supabase

Aplicación Angular 21 independiente conectada directamente a Supabase Auth, PostgreSQL/RPC, Storage,
Realtime y Edge Functions. No necesita el backend Spring ni un proxy `/api`.

Incluye página pública, agenda y solicitudes, pacientes, historia clínica, odontograma, tratamientos,
presupuestos, caja, WhatsApp/seguimientos y administración.

## Desarrollo local

Este directorio contiene el frontend. Los comandos de Supabase siguientes requieren disponer
del repositorio backend y de su directorio `supabase`; no están incluidos en esta copia.
Para trabajar con el proyecto remoto configurado, ejecute aquí `npm ci` y `npm start`.

Desde la raíz del repositorio:

```bash
npx supabase start
npx supabase db reset
cd dental-americana-supabase
npm ci
npm start
```

Abra `http://localhost:4200`. Para probar Edge Functions, copie
`../supabase/functions/.env.example` como `../supabase/functions/.env` y ejecute desde la raíz:

```bash
npx supabase functions serve
```

## Validación

```bash
npm run validate
npm audit
npm run check:connection
```

`check:connection` verifica únicamente la salud de Auth y el acceso a PostgREST: no consulta pacientes
ni realiza escrituras. No sustituye las pruebas de login, permisos, SQL, Storage, WhatsApp o IA.
Para comprobar otra configuración sin modificar el frontend, puede recibir `SUPABASE_URL` y
`SUPABASE_PUBLIC_KEY` desde el entorno. Las compilaciones Angular siguen usando los archivos de
`src/environments`; una clave pública debe pertenecer exactamente a la URL del proyecto configurado.
Nunca utilice `service_role` ni claves `sb_secret_` en el frontend.

El detalle de las correcciones, verificaciones y pendientes está en
[`docs/OPTIMIZACION_SEGURA.md`](docs/OPTIMIZACION_SEGURA.md).
El flujo guiado se describe en [`docs/FLUJO_CLINICO_GUIADO.md`](docs/FLUJO_CLINICO_GUIADO.md)
y el diseño actualizado del odontograma en
[`docs/MEJORA_DISENO_ODONTOGRAMA.md`](docs/MEJORA_DISENO_ODONTOGRAMA.md).

Las pruebas automatizadas usan dobles de los servicios; no sustituyen la validación con Supabase y WhatsApp conectados.

## Flujo de trabajo para un consultorio unipersonal

La cuenta principal debe usar el perfil **Propietario odontólogo**, que combina los roles
`ADMINISTRADOR` y `ODONTOLOGO`. Esta combinación permite administrar el sistema y ejecutar las
aprobaciones clínicas que requieren de forma explícita a un odontólogo activo.

1. En **Inicio → Mi jornada**, revisa las citas pendientes de atender, solicitudes por agendar,
   conversaciones sin leer y envíos fallidos. Usa Actualizar para consultar los pendientes nuevamente.
   Si aparece «Información parcial», no asumas que los módulos que fallaron están al día.
2. Selecciona una cita y abre su atención. Avanza por los siete pasos de **Historia** (anamnesis, riesgos, examen, valoración,
   consentimiento, procedimiento y cierre); si intentas
   finalizar con datos esenciales pendientes, el sistema te lleva al primero. Al abrir **Odontograma**
   o **Plan y pagos**, la historia modificada se guarda antes de cambiar de sección.
3. En **Plan y pagos**, crea o edita el presupuesto en borrador: agrega procedimientos, ajusta
   descuento y observaciones, guarda y presenta el plan. Tras la aceptación expresa del paciente,
   el saldo y los adelantos aparecen en esa misma sección. La aceptación se registra desde
   **Revisar y firmar presupuesto**: el paciente revisa el detalle, firma y confirma. La copia
   guardada se consulta con **Presupuesto y firma** y se puede imprimir o guardar como PDF.
   Los planes aceptados previamente también permiten registrar su firma, con la fecha actual.
   Cada nuevo abono exige la firma del
   paciente en pantalla y genera una constancia imprimible.
   En **Finanzas → Pagos**, **Anular** permite corregir un cobro de la caja que sigue abierta.
   Requiere motivo y confirmación, conserva la firma original, devuelve el importe al saldo
   pendiente y registra un ajuste de caja. Las cajas cerradas no se modifican desde esta acción.
4. **Agendar control** precarga paciente y odontólogo; utiliza la fecha del próximo control si es válida
   y no está en el pasado. Selecciona un horario disponible y confirma para crear la cita.
5. Los borradores modificados de historia clínica, odontograma y presupuesto muestran una advertencia
   al salir, recargar o cerrar sesión. El guardado al cambiar de sección se aplica solo a la historia;
   guarda el odontograma y el presupuesto desde sus controles antes de salir.

### Verificación conectada y comprobaciones pendientes

Se verificaron login, atención de prueba, guardado y recarga, aprobación de odontograma,
finalización de atención y conservación de borradores al cambiar de paciente. También se
verificó el flujo guiado y el odontograma en navegador móvil y escritorio.
Se completó además el recorrido con presupuesto y abono firmados, finalización, control
y anulación del abono de prueba. El detalle y los límites de permisos están en
[`docs/VALIDACION_FLUJO_COMPLETO.md`](docs/VALIDACION_FLUJO_COMPLETO.md).
Comprobar que siempre corresponde al mismo paciente; cancelar el descarte de un borrador y verificar
que sigue intacto. Verificar también el flujo en móvil y contrastar los contadores de Mi jornada con
la bandeja real. Esta actualización no despliega Edge Functions ni prueba envíos reales de WhatsApp.

## Historia clínica para imprimir

En **Pacientes → ficha del paciente → Historia clínica completa**, revisa el documento y pulsa
**Imprimir / Guardar PDF**. Para descargarlo, selecciona **Guardar como PDF** en el diálogo del navegador.
Requiere `PACIENTE_LEER` y `CLINICA_LEER`. Tratamientos y citas se incluyen según los permisos del usuario;
las secciones sin autorización se identifican en el documento.

El informe muestra la ficha actual, antecedentes, alergias, medicamentos, atenciones finalizadas,
odontogramas aprobados de esas atenciones, planes fuera de borrador y citas del paciente.
Las atenciones borrador/anuladas se cuentan como excluidas. Los archivos tienen descarga individual
auditada: el PDF contiene su relación, no el contenido de radiografías, fotografías o PDF adjuntos.
No se genera una firma digital ni se envía el documento a otra clínica automáticamente.

La consulta se instala con `202609150003_patient_clinical_report.sql`. Las pruebas de permisos,
aislamiento por paciente y aprobación están en `supabase/tests/patient-clinical-report.sql`.

## Retiro de DentalIA

El módulo DentalIA fue retirado de la interfaz y de las rutas de la aplicación. También se retiró
su integración por WhatsApp: el webhook ya no la enruta y el endpoint antiguo responde HTTP 410.
Las Edge Functions remotas `copilot-chat` y `copilot-generate` fueron eliminadas. Se conservan las
tablas y los registros históricos; no se borraron datos de Supabase. Los documentos de DentalIA
describen el estado previo.

Seguimientos conserva la conexión única de WhatsApp para pacientes, citas y seguimientos. Para
terminar el enlace del teléfono de la clínica, abre **Seguimientos → Configuración → Conectar
WhatsApp** y escanea el QR desde **Dispositivos vinculados** en ese teléfono.

## Producción

Las firmas de presupuesto y las anulaciones requieren la migración
`202609290006_signed_budget_and_payment_void.sql`, además de las anteriores. Desplegar la base
antes del frontend actualizado: la aceptación antigua por casilla pasa a requerir la firma.
Las pruebas SQL `supabase/tests/signed-budget.sql` y `signed-advance.sql` verifican permisos,
versiones, reintentos, conservación del acuerdo, saldo y bloqueo de cajas cerradas.

La ruta preparada para producción está en `../ops/production/README.md`. Requiere separar el proyecto
Supabase de desarrollo, configurar dominio y túnel estables, respaldos y pruebas controladas antes de
atender pacientes. No coloque `service_role`, credenciales de Evolution API ni claves de IA en Angular.

Consulte `../GUIA_CONEXION_SUPABASE_WHATSAPP.md` para el despliegue y la conexión de WhatsApp.

El estado verificado de la integración Evolution, la recuperación del túnel y los pasos pendientes
de vinculación están en [Reparación de WhatsApp](docs/REPARACION_WHATSAPP.md).

El consultorio utiliza un solo número de WhatsApp para conversaciones, citas y seguimientos.
Desde **Seguimientos → Configuración → Conectar WhatsApp**, genera el QR y escanéalo en el teléfono
de la clínica mediante **Dispositivos vinculados**. El enlace físico del teléfono es el último paso
para activar envío y recepción reales. La integración y sus pasos pendientes están en
[WhatsApp con un número](docs/WHATSAPP_UN_NUMERO.md).

Los filtros y las respuestas rápidas de la bandeja están documentados en
[Mejora de conversaciones](docs/MEJORA_CONVERSACIONES_WHATSAPP.md).

El resumen del día, las preguntas operativas y sus fuentes están documentados en
[Mejora de DentalIA dentro del sistema](docs/MEJORA_DENTALIA_SISTEMA.md).
