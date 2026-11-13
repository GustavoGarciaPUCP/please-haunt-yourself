# Encargo 10 — compilación reproducible, conservando v9

Preparado por Codex el 10 de noviembre de 2026. Lee `AGENTS.md`, `.kiro/steering/project-contract.md`, `docs/development/33_V9_Independent_QA_And_First_Visit.md` y las specs `.kiro/specs/fluid-typing-v9/`. Esta es una corrección acotada de la compilación; no pide rediseñar el juego ni añadir aplicaciones.

## 1. Reproduce la discrepancia antes de corregir

En `C:\Users\51924\Documents\Kiroween2026\PleaseHauntYourself`, Codex ejecutó dos veces `npm.cmd run build`. Ambas fallaron antes de Vite, aunque `npm.cmd test` aprobó los 166 tests. El log es `output/playwright/codex-v9-review/build.log`.

Errores observados:

```text
tests/fluid-typing-v9.test.ts(3,43): error TS2591: Cannot find name 'node:fs'.
tests/fluid-typing-v9.test.ts(103,45): error TS7006: Parameter 'name' implicitly has an 'any' type.
tests/fluid-typing-v9.test.ts(103,79): error TS7006: Parameter 'name' implicitly has an 'any' type.
tests/fluid-typing-v9.test.ts(104,37): error TS7006: Parameter 'file' implicitly has an 'any' type.
tests/fluid-typing-v9.test.ts(105,25): error TS7006: Parameter 'file' implicitly has an 'any' type.
```

El test importa `readFileSync` y `readdirSync` de `node:fs` para comprobar archivos fuente. `tsconfig.json` incluye `tests`. En esta instalación no existe `node_modules/@types/node`; tampoco está declarado como dependencia directa ni aparece su paquete en `package-lock.json`. Node instalado: v22.13.1. Confirma la causa y revisa por qué el registro anterior decía que la compilación final pasaba; documenta lo que puedas demostrar, sin inventar otro entorno o una ejecución pasada.

El servidor existente sí entrega la compilación v9 `haunt-CgO5uN2S.js` / `haunt-9asRCWsn.css`. Que ese `dist` funcione no demuestra que se pueda regenerar desde el árbol actual.

## 2. Elige la reparación mínima y explícita

Compara las alternativas pertinentes: declarar correctamente los tipos de Node que usa ese test, o conservar su intención con una comprobación compatible con el entorno ya declarado. Elige con criterio y explica el coste. Si hace falta una dependencia de desarrollo, identifica la necesidad concreta, declárala y conserva un lockfile coherente; no dependas de paquetes globales o de una instalación accidental. No instales otra aplicación ni actualices el entorno entero para este problema.

Mantén el chequeo estricto. No lo resuelvas quitando `tsc` del build, excluyendo los tests para ocultar errores, usando `any`/`@ts-ignore` ni borrando sin sustitución una propiedad que quieras seguir garantizando. Si decides que el test que inspecciona texto de fuente es demasiado frágil, razona la sustitución y demuestra el comportamiento relevante con una prueba significativa.

Conserva íntegramente las mejoras de v9: guardado inmediato y honesto, invalidación de preguntas, snapshots de entrega, filtros `mail-draft`/`case`, actualización de vistas ante cambios reales, cachés de imagen con tamaño/identidad correctos, caret/selección/Undo/pegado y coherencia de la ventana activa sin cambio de foco.

## 3. Verifica desde el mismo árbol que entregas

- Ejecuta `npm.cmd run typecheck`, `npm.cmd run build` y `npm.cmd test`; informa comandos, salidas, entorno real y hashes finales.
- Comprueba que una instalación de las dependencias declaradas puede satisfacer el test: no aceptes que solo funcione por un paquete extra que quedó en `node_modules` y falta en el manifiesto/lockfile. Si verificas una instalación limpia, usa un directorio temporal aislado y las versiones declaradas.
- Si solo cambias tipos/configuración de test, comprueba que el runtime y la presentación siguen siendo los mismos. No hace falta cambiar el identificador visual únicamente para aumentar el contador de versión.
- Repite `check:typing` y `check:active` y el recorrido de cierre pertinente. Amplía la regresión solo si tus cambios afectan al runtime o si aparece un fallo nuevo; no repitas perfiles de rendimiento pesados sin una razón.
- Mantén el problema y su reparación en requisitos/diseño/tareas y en `docs/kiro-usage.md`, con atribución real y sin atribuir resultados de Codex a Kiro.

La revisión independiente y la primera visita de agente están en review33. Sus observaciones no son pruebas con personas. Los timeouts, resets o problemas de carga de la herramienta de automatización no se deben convertir automáticamente en defectos del juego. No implementes rediseños basados en esas limitaciones instrumentales.

## 4. Cierre honesto

Entrega causa, cambios, evidencia de build reproducible y límites pendientes. Preserva las fechas reales y la procedencia según review32. La licencia de código abierto, la publicación del repositorio/app, el video y la presentación siguen siendo pasos separados. No elijas una licencia ni hagas commit, push, publicación o envío con este encargo.

No hay un mandato de añadir más acertijos, animaciones o tutoriales: esta iteración debe cerrar el fallo concreto de build y conservar la experiencia que ya funciona.
