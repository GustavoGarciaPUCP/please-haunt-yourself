# Encargo 07 — cerrar una combinación de confirmaciones de POSTMAN

Preparado por Codex el 9 de noviembre de 2026 para ejecución manual en Kiro IDE. Es un encargo preparado, no una reparación ya ejecutada. Conserva la versión v6, su diseño y sus correcciones de texto dibujado.

## 1. Lee el estado actual y cuestiona esta revisión

Carpeta: `C:\Users\51924\Documents\Kiroween2026\PleaseHauntYourself`.

Lee `AGENTS.md`, `.kiro/steering/project-contract.md`, `docs/development/28_V6_Independent_QA_And_Confirmation_Flow.md`, las specs `.kiro/specs/visual-precision-v6/` y el contrato de entregas de los documentos 23/25 y las specs v4/v5. No rehagas prompt06 ni presentes sus defectos reparados como pendientes.

El participante pide seguir puliendo con criterio. Valida la reproducción de Codex y distingue hechos de recomendaciones. Documenta qué aceptas, modificas o rechazas y por qué. Mantén el carácter del SO, las cuatro aplicaciones y la independencia de la carta enviada frente al borrador.

## 2. Reproduce el defecto antes de corregirlo

En la interfaz real, sin inyectar un caso resuelto:

1. Completa la carta A y envíala a guest. **Todavía no pulses Finish session.**
2. Vuelve a CANVAS → Letter → Reset to the capture… → Reset. Queda un nuevo borrador B con la escritura sin levantar; es incompleto.
3. Compose in POSTMAN → guest → Send.
4. POSTMAN advierte que está incompleto. Pulsa Send anyway.
5. POSTMAN advierte que reemplazará la carta completa anterior. Pulsa Replace.
6. Vuelve a la advertencia de incompleto. Si pulsas Send anyway, vuelve a Replace. La entrega nueva nunca se confirma.

Codex comprobó que A permanece intacta y que se puede cancelar esta ruta, volver a A y terminar el caso. Es un bucle en una operación secundaria permitida, no una pérdida del guardado ni un bloqueo de toda la partida.

Puntos de entrada:

- `src/haunt/postman-view.ts`: los comandos `send-anyway` y `replace`, el tipo de confirmación y `send()`.
- `src/haunt/mail-model.ts`: `MailModel.send()` comprueba `confirmIncomplete` y después `confirmReplace`.

Cada comando vuelve a enviar una sola aceptación. Cuando `replace` se ejecuta, `this.confirm.kind` es `replace`, por lo que el intento pierde la aceptación de incompleto. Al aceptar incompleto se pierde a su vez la de reemplazo.

## 3. Elige una política comprensible y completa la operación

Preferencia de Codex: conservar la posibilidad existente de enviar algo incompleto y reemplazar explícitamente, recogiendo ambas decisiones de forma coherente. Puedes proponer una confirmación combinada o una secuencia finita. Si consideras mejor cambiar esa política, justifica el efecto en los requisitos, mensajes y datos antes de implementarlo.

Requisitos del resultado:

- Toda confirmación describe el contenido y la entrega que realmente afectará. La persona puede cancelar sin cambios.
- Después de aceptar las advertencias pertinentes, la operación termina una vez; no alterna entre las mismas preguntas ni duplica envíos.
- El texto no promete que una carta incompleta permitirá cerrar el trabajo. Su acuse sigue sin certificar una carta completa.
- La carta A conserva su instantánea. Solo una decisión explícita puede cambiar qué entrega sostiene el trabajo, según la política documentada.
- No soluciones el bucle quitando la validación de completitud, certificando B con el acuse A, haciendo Replace sin consentimiento o bloqueando toda edición posterior.
- Si acumulas aceptación entre pasos, lígala al borrador/contenido, destinatario y entrega afectada. Editar la carta, cambiar destinatario, quitar el adjunto, cancelar, descartar o reabrir no debe reutilizar una decisión para otro contenido.
- Después de Finish, se mantiene la semántica Copy de v5/v6: otra copia no revoca la carta aceptada ni exige Replace.

Usa la solución mínima que sostenga esas propiedades. No hace falta un backend, un sistema general de aprobaciones ni otra aplicación.

## 4. Verifica combinaciones, no solo advertencias aisladas

Añade las regresiones que prueben este defecto y su solución:

- A completa ya entregada + B incompleta → aceptar/cancelar en cada paso → resultado finito, honesto y sin duplicados.
- A completa + B sin adjunto, y A completa + B procedente de una captura de sesión: misma política, sin inventar escritura.
- Ambas advertencias aceptadas con puntero y con una ruta natural de teclado.
- B corregida a completa: reemplazo normal sigue funcionando.
- Cambio de contenido o destinatario entre pasos: no reutiliza una confirmación anterior sin comprobar lo que ahora va a ocurrir.
- Cancelar → A intacta y aún utilizable para terminar. Reload conserva un guardado válido.
- Después del final: envío de una copia completa o incompleta según la política ya existente, sin cambiar la carta aceptada.

Conserva las pruebas de historial acotado, A enviada/B editada, recuperación y fuentes. Repite los checks afectados y el caso completo. Inspecciona la confirmación en los tres tamaños PC y el mínimo de POSTMAN. No relajes auditores para ocultar una regresión.

## 5. Mantén el avance de experiencia

Codex considera acertados el diseño actual, el visor espacial de ECHO, las elecciones de fotografía, el contenido real que pasa entre apps y la vista del cristal en el acuse. Sigue siendo válido cuestionar este juicio con evidencia.

La firma de la nota a unos 5 px en ECHO mínimo y la reducción de su imagen son limitaciones conocidas. No las conviertas automáticamente en otro rediseño: el fragmento y el contexto son lo importante para avanzar. Verifica si una información esencial queda solo en texto ilegible; si es así, hazla accesible con una intervención pequeña y coherente. No añadas texto ornamental, otra mecánica obligatoria ni más programas por sumar alcance.

No atribuyas diversión, comprensión humana o un estándar ganador a los tests. La siguiente validación de experiencia debe observar si una primera visita entiende la causa del retorno, reconoce su elección fotográfica y deduce quién recibe la carta. Una simulación con IA tendría que declararse simulación; esta tarea no inventa personas ni resultados.

## 6. Entrega concreta

Prepara requisitos/diseño/tareas de esta iteración conservando los anteriores. Implementa la corrección y sométela a una segunda crítica propia tras jugarla.

Entrega la reproducción antes, el resultado después, las decisiones aceptadas/modificadas/rechazadas, pruebas ejecutadas, capturas comparables, defectos/límites pendientes y cómo abrir la compilación nueva en `/haunt.html`. Actualiza README, instrucciones vigentes y kiro-usage con contribuciones reales. Modelo, esfuerzo y créditos solo si son observables.

Conserva el prototipo histórico, licencias y las bases verificadas. No automatices el escritorio nativo, cambies cuentas, compres, instales software sin necesidad concreta, publiques, hagas push ni envíes a Devpost. Este es un encargo de implementación local acotada y evidencia, no solamente otro plan.
