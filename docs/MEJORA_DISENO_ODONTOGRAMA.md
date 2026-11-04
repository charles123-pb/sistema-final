# Mejora del diseño del odontograma

Se conservan las condiciones, estados, numeración FDI, denticiones, selección de superficies, marcado rápido opcional, aprobación, permisos, hallazgos y contratos de API. No se modificaron tablas ni registros para esta mejora visual.

## Antes y después

- Superficies pequeñas en el mapa: se amplió el espacio del mapa y los controles de selección. La vista ampliada ofrece superficies mayores a 52 px en las pruebas de navegador.
- En móvil se abría la arcada completa: al cargar o cambiar dentición en pantalla pequeña se abre el cuadrante superior derecho. Todos los demás cuadrantes y la vista completa siguen disponibles; se conserva el desplazamiento horizontal para mantener el orden anatómico.
- Detalle lejano en móvil: se añadió un acceso visible al detalle de la pieza y un botón para volver al mapa. No se duplicaron formularios.
- Hallazgos superpuestos: se mantiene la prioridad visual original, pero se muestra un indicador de hallazgos adicionales; las descripciones accesibles y títulos incluyen todos los hallazgos aplicables de la superficie y de la pieza general. El listado completo sigue disponible.

## Colores y límites clínicos

Se conservó la paleta actual. El estado de tratamiento (existente, indicado o realizado) no determina por sí solo si una restauración o prótesis está en buen o mal estado. El modelo actual no registra esa distinción. Convertir automáticamente esos estados a colores normativos podría representar información clínica incorrecta.

La adecuación completa a la NTS 188 requiere revisar simbología, representación de raíces y campos clínicos necesarios con el responsable del servicio. Esta mejora no acredita cumplimiento de la norma ni sustituye esa validación. Referencia: https://www.gob.pe/institucion/minsa/normas-legales/3304261-559-2022-minsa

## Verificación

- 238 pruebas en 40 archivos: aprobadas, incluida una nueva prueba de hallazgos superpuestos sin alteración de registros.
- Build de producción, linter y revisión de tipos: aprobados.
- Chromium, anchos 390 y 1440 px, sesión real en entorno de prueba: carga del odontograma, navegación mapa/detalle, cuadrante inicial móvil, superficies ampliadas y ausencia de desbordamiento horizontal global verificados. Sin excepciones de página.
- No se realizaron guardados ni cambios de aprobación durante la prueba visual.
- Cambios locales; no se desplegaron al servidor.

## Archivos

- `odontogram-editor.ts`: cuadrante inicial móvil y navegación al mapa.
- `odontogram-editor.html`: accesos mapa/detalle.
- `odontogram-editor.css`: tamaños táctiles y acceso móvil.
- `tooth-surface-map.ts`, `.html`, `.css`: representación y descripción de múltiples hallazgos.
- `tooth-surface-map.spec.ts`: prueba de superposición y actualización de descripción accesible.
