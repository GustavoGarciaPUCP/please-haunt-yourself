# Encargo 09 — escritura fluida y ventana activa, mismo juego

Preparado por Codex el 9 de noviembre de 2026 para ejecución manual del participante en Kiro IDE. Es una propuesta de mejora de rendimiento, no una reparación ya implementada ni una afirmación de que v8 esté bloqueada.

## 1. Lee y conserva el punto alcanzado

Carpeta: `C:\Users\51924\Documents\Kiroween2026\PleaseHauntYourself`.

Lee `AGENTS.md`, `.kiro/steering/project-contract.md`, `docs/development/30_V8_Functional_Checkpoint_And_Typing_Review.md`, las specs `.kiro/specs/free-text-v8/` (especialmente design-review §5), y los contratos de confirmación/snapshots de v7.

Conserva el diseño, las cuatro aplicaciones, el recorrido, sus decisiones, sus imágenes y los límites 80/120/600. El antiguo desborde de POSTMAN está reparado. Esta iteración no añade programas, acertijos, tutoriales ni otra historia.

Cuestiona la propuesta de Codex: reproduce el coste de escribir, compara alternativas y documenta qué aceptas/modificas/rechazas. No conviertas una medición instrumental en una afirmación de que una persona sintió lentitud.

## 2. Mide primero con un caso real y una carga comparable

Abre las cuatro apps recorriendo el caso hasta el borrador de POSTMAN. Usa teclas reales en Message. Compara con un textarea de control sin listeners de la app, y con solo POSTMAN abierto. Si usas CPU4×, indica que es una simulación, y conserva una medición normal.

Registra las mismas muestras antes/después: cantidad de teclas, tiempo total de entrada, trabajo síncrono del evento, mutaciones por aplicación, llamadas reales de dibujo y escrituras del guardado. No midas a la vez que otra batería pesada de navegadores si quieres comparar latencia. Identifica el coste que añade tu propio instrumento.

La hipótesis respaldada por el código y los perfiles es que un cambio del borrador de correo dispara `CaseStore.changed()` y sus suscriptores generales: otras aplicaciones sincronizan sus vistas aunque su contenido no cambió. "Se ejecuta render" no implica que todos sus píxeles se repinten; distingue callbacks, mutaciones y dibujo efectivo.

## 3. Implementa la mejora mínima justificada

Busca que escribir el mensaje actualice el borrador, el contenido pertinente de POSTMAN y el guardado, sin reconstruir el DOM o dibujar imágenes sin cambios en ECHO/CANVAS/TERMINAL. La propia carta de POSTMAN tampoco debe redibujarse por cada tecla si ni su fuente ni su geometría cambiaron. Un cambio real de fase, recurso o estado de guardado sí debe propagarse.

Compara al menos dos alternativas acotadas: notificaciones con ámbito/tipo de cambio, y descartes tempranos basados en una identidad o revisión relevante para cada vista. Puedes proponer otra mejor. No hagas `JSON.stringify` de todo el caso en cada vista solo para decidir si puede evitar el trabajo que ya pagó al serializarlo.

No introduzcas un framework de estado, nuevas dependencias, un backend, una capa general de eventos innecesaria ni una reescritura del modelo. No cierres/minimices apps automáticamente, reduzcas la calidad de sus imágenes ni elimines guardado para mejorar números.

No empieces por retrasar la escritura del modelo o el guardado: los perfiles previos indican que la mayor parte del coste está en las vistas. Si tu evidencia propone otra cosa, demuéstralo. Si introduces agrupación por frame o persistencia diferida, especifica y prueba qué ocurre antes de Send, al cerrar, al ocultar la pestaña y al recargar. No puede perderse la última entrada ni decir Saved antes de guardarse.

## 4. Propiedades que deben mantenerse

- Cada carácter real llega al mismo borrador, con los mismos límites y contenido Unicode admitido.
- Caret, selección, edición en medio del texto, pegar, borrar y Undo propio del campo siguen funcionando. No reemplaces el input/textarea activo en cada actualización.
- Send lee inmediatamente el último contenido, aunque la persona no haya dejado de escribir.
- Cambiar carta, adjunto, destinatario, asunto, mensaje o estado del caso invalida una pregunta anterior cuando corresponde. No ganes rendimiento dejando una confirmación obsoleta abierta.
- Carta enviada A y borrador B siguen independientes. Las copias después del final no cambian el trabajo aceptado.
- Las otras apps reflejan sus cambios reales: nueva captura, carta editada, envío, fase, acuse, final, Replay y recuperación.
- Al volver a abrir o restaurar una ventana se ve el estado actual; no depende de provocar otro evento para actualizarse.
- Guardado, Session only, recarga y fallos de almacenamiento siguen siendo honestos y sin pérdida de datos.
- Las reparaciones de texto largo, imágenes y teclado de v8 se conservan.

## 5. Pruebas que demuestren una mejora real

Repite el perfil de entrada con la misma muestra y condiciones. Documenta la reducción de trabajo ajeno al borrador y cualquier coste residual. No impongas un número universal de milisegundos basado en una máquina; la eliminación de trabajo innecesario debe ser observable, y las comparaciones deben hacerse bajo condiciones equivalentes.

Verifica al menos:

- Escritura tecla por tecla, edición en medio, selección/reemplazo y pegado cerca de los límites.
- La última tecla seguida inmediatamente de Send, cierre/reapertura y reload: mismo contenido exacto.
- Pregunta abierta → cambio real de su contenido → respuesta vieja no envía otra cosa.
- Las cuatro apps abiertas, minimizadas y restauradas; solo POSTMAN; datos persistidos iguales.
- Guardado bloqueado, lectura posterior, A/B y copias.
- Recorrido completo por puntero y teclado, incluida corrección y final.
- Checks afectados (`text`, `confirm`, `letter`, `case`, `keys`, `paths`) y build/tests pertinentes. Añade pruebas que cubran propiedades nuevas, no tests que se limiten a repetir cómo codificaste un filtro de eventos.

Si no puedes demostrar una mejora o aparece una regresión, conserva la solución correcta y documenta la evidencia. No sacrifiques coherencia o integridad para cumplir una expectativa de velocidad.

## 6. Coherencia de la ventana activa, un defecto visual menor independiente

Al preparar el perfil se observó otra inconsistencia, confirmada después sin instrumentación de escritura: TERMINAL inicialmente tiene el marco activo. Abre ECHO, ciérralo con X y haz clic en el campo de TERMINAL. La barra de tareas marca TERMINAL como activo y el campo recibe foco, pero el marco conserva el estilo inactivo. Minimizar y restaurar TERMINAL recupera el estilo correcto.

La reproducción y los colores/sombras están en `output/playwright/codex-v8-review/window-activation.json`. No se afirma que este defecto empezara en v8. No bloquea el juego.

Revisa `window-manager.ts`: `raise()` sincroniza `.is-active`, pero close/minimize eligen otro contexto sin volver a sincronizar ese indicador; el modelo ya considera activa a la ventana que queda, por lo que un clic dentro no fuerza otro raise.

Corrige la discrepancia entre el estado real, la barra de tareas y la presentación, con el menor cambio. Conserva la política de foco accesible: no enfoques un campo ni robes la entrada como efecto colateral de arreglar un borde. Prueba cerrar/minimizar la ventana activa con otra detrás, hacer clic y escribir en la que queda, cerrar la última, restaurar y usar teclado. El caso y el orden de las ventanas no se reinician. Esta reparación puede hacerse separadamente de la mejora de rendimiento.

## 7. Entrega y alcance

Prepara requisitos/diseño/tareas conservando los anteriores; implementa y critica tu propio resultado después de usarlo. Entrega perfil comparable antes/después, cambios, decisiones aceptadas/modificadas/rechazadas, resultados exactos, límites pendientes y cómo abrir la nueva compilación.

Actualiza README, instrucciones vigentes y kiro-usage con contribuciones reales. No inventes modelo, esfuerzo, créditos, usuarios, tiempos humanos o premios. V8 ya sirve como base para una primera visita; no presentes esta mejora de rendimiento como un acertijo nuevo ni como prueba de diversión.

Respeta las licencias, las bases verificadas y el prototipo histórico. No automatices el escritorio nativo, cambies cuentas, compres, publiques, hagas push, instales software sin una necesidad concreta ni envíes a Devpost. Trabaja en la mejora local y su verificación.

## 8. Contexto oficial actualizado — 9 de noviembre

Lee también `docs/development/31_Official_Category_And_Judging_Refresh.md`, verificado con el conector oficial de Devpost después de recuperar la conexión. Kiroween 2026 está abierto y Costume Contest sigue siendo la categoría recomendada: el diseño de Halloween debe mejorar la función de la app. La propuesta de presentar este escritorio web para PC se conserva.

Los criterios oficiales pesan 20% cada uno: impacto, implementación tecnológica (uso de Kiro), diseño, innovación e idea, y presentación. Haz que la mejora de fluidez y de ventana activa preserve la experiencia completa; no añadas funciones ni supuestos beneficios educativos para intentar cubrir esos criterios.

La revisión también registra pendientes de entrega: falta un archivo de licencia de código abierto en la raíz, y quedan por verificar/publicar la URL de prueba, el GitHub público, el video público de menos de tres minutos y el texto final de uso de Kiro. Son checkpoints de entrega separados de esta implementación. No elijas una licencia, publiques ni envíes nada como efecto colateral de este encargo.

El agente de primera visita se reserva para después de verificar esta iteración; no inventes que ya hubo personas probando el juego ni adaptes sus instrucciones con la solución.

## 9. Fechas y procedencia: condición explícita de entrega

Lee `docs/development/32_Development_Dates_And_Submission_Provenance.md`. El inicio oficial fue el 30 de octubre de 2026 a las 11:00 de Lima. Los 20 commits alcanzables revisados son posteriores; el primero y la dirección del escritorio con programas muertos son del 5 de noviembre. Esto respalda el historial, sin certificar por sí solo el origen de cada archivo.

Conserva las fechas reales, el historial y la atribución. Identifica cualquier código, diseño o recurso previo incorporado y distingue planificación histórica de implementación. Una fecha de commit posterior o una declaración de material previo no convierten en elegible un proyecto iniciado antes del período. No cambies fechas, reinicies el repositorio ni borres evidencia histórica para aparentar desarrollo nuevo. Si encuentras implementación del proyecto anterior al inicio, señálala para resolver su inclusión antes de la entrega.

Esta revisión de procedencia no autoriza push, publicación ni envío. No requiere cambiar la historia de 1987, las citas de proyectos de 2025 ni la fecha legítima de una dependencia.
