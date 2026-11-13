# Encargo 06 — precisión visual y QA del recorrido v5

Preparado por Codex el 9 de noviembre de 2026 para ejecución manual del participante en Kiro IDE. Es un encargo preparado, no una implementación ya realizada. El participante valora el diseño actual y pide verificar jugabilidad, flujo y relaciones, además del texto que sale de la nota en ECHO.

## 1. Parte de la entrega real y conserva lo que funciona

Carpeta: `C:\Users\51924\Documents\Kiroween2026\PleaseHauntYourself`.

Lee:

1. `AGENTS.md` y `.kiro/steering/project-contract.md`: la entrega actual es v5 y los bloques anteriores conservan historia.
2. `docs/development/27_V5_QA_Flow_And_Canvas_Text_Review.md` completo: incluye mediciones, resultados y límites de la revisión independiente.
3. `.kiro/specs/playability-v5/requirements.md`, `design.md`, `design-review.md` y `tasks.md`.
4. Los contratos23 y25, el prompt05 ejecutado y la revisión26 para conservar las decisiones y entender qué fallos ya están corregidos.
5. El código afectado, README y el protocolo de primera visita existente.

Codex revalidó build,125 tests/12 archivos,57 recorridos/10 scripts, la ruta visual de177 estados y dos rutas exploratorias de juego. La nota y la cabecera todavía tienen defectos que el auditor de HTML no detecta. No vuelvas a presentar como abiertos el guardado, Undo tras recarga o las ventanas mínimas de v4: los recorridos actuales verifican sus correcciones en v5.

Mantén el estilo del escritorio y las cuatro aplicaciones. Este encargo es de implementación y validación acotadas, con criterio propio. Cuestiona la revisión de Codex: reproduce sus hechos y escribe posiciones aceptar/modificar/rechazar con razones y evidencia para sus propuestas. No inventes consenso ni pruebas con personas.

## 2. Repara la nota dentro de la imagen de Session window

Reproducción: abre ECHO → Session window → Live. Mira la nota abajo a la izquierda, también con ECHO maximizado, al pausar y en una captura retenida.

En `src/haunt/glass-render.ts`, `drawSessionFrame()` dibuja un papel de70×34 en un espacio lógico320×200. Actualmente:

- `NOTE_START` / `FOR THE NEXT PER—`: x5 + ancho medido81,53 =86,53, fuera del papel.
- Firma `— Mara, 31 Oct 1987`: x22 +59,31 =81,31, también fuera.

El problema está dentro del canvas: agrandar la ventana escala todo junto y no lo soluciona. Implementa un diseño de texto que use las métricas reales de la fuente, márgenes, saltos de línea y/o una geometría proporcionada. Conserva una lectura razonable. Revisa bearings, cursiva, firma, rotación, fuentes de respaldo y dimensiones/DPR. Si usas un clip como protección final, no debe ser la forma de esconder letras que no caben.

Conserva el fragmento intencional `FOR THE NEXT PER—` y su significado de nota inconclusa. No lo conviertas en el mensaje completo para hacer más fácil la captura ni insertes las cinco líneas del cristal en una captura de sesión.

Busca el mismo tipo de fallo en otros dibujos: imágenes retenidas, miniaturas, previews de CANVAS, firma y texto de la carta, POSTMAN, acuse y final. Distingue un encuadre elegido por el jugador, el recorte intencional del texto que forma la figura y un desborde accidental de palabras fuera del papel. No corrijas los dos primeros como si fueran este defecto.

## 3. Resuelve la cabecera superpuesta

La etiqueta DOM `.echo-overlay-source` (LIVE/PAUSED · last.session) tapa la cabecera dibujada por el canvas (nombre, hora grabada y PID). Reproducido en tamaño normal y maximizado.

Asigna espacio deliberado al estado del visor y al contenido de la fuente. Elige la solución más clara para este diseño; no basta colocar otro fondo opaco encima del mismo texto. Mantén la diferencia entre el reloj actual del SO y el minuto grabado. Evita hacer microscópicos los metadatos u ocultar la imagen.

Comprueba Live, Pause, Resume, ambas fuentes, capturas, mínimos/máximos y tres tamaños PC. Si modificas qué pertenece a la imagen frente al visor, conserva la coherencia entre lo visto, lo retenido y lo mostrado después. No alteres el caso ni fabriques progreso.

## 4. Haz que los rótulos describan lo que se ve

La fuente Session window muestra una nota escrita y una firma, pero dice `No writing`. El modelo se refiere a que no tiene la capa del mensaje completo recuperable del cristal; la persona ve palabras escritas.

Mejora esa distinción sin jerga ni párrafos de tutorial. Una posibilidad es `Unfinished note`, con contexto breve sobre el mensaje que falta. Cuestiónala y usa una solución mejor si la encuentras. Ajusta el texto a las fases: no digas que la fuente está vacía mientras muestre información que contradice esa afirmación. No adelantes la solución de la campana.

No cambies la procedencia de las palabras para hacer coincidir un rótulo. Las capturas de sesión siguen sin dar la escritura completa; las capturas reales del cristal conservan sus cinco líneas.

## 5. Revisa jugabilidad y continuidad con criterio propio

Repite el caso entero: TERMINAL → ECHO → CANVAS → POSTMAN → TERMINAL. Conserva una sola historia, el emisor Mara, el destinatario guest, el único productor de campana, la entrega inmutable y el acuse real.

Comprueba también:

- Acierto temprano de la campana: poder llegar al cristal sin fallar primero.
- Abrir apps antes de tener su material: estados vacíos honestos y una forma clara de continuar.
- Muffle frente a Stop; Force con retry activo y sin retry; recuperación de la sombra.
- Pausar la vista frente a detener el proceso; fuente equivocada y exposición correcta; capturas pasivas y reemplazo explícito de la fuente de la carta.
- Perder escritura, recargar y recuperarla desde su fuente sin perder encuadre, papel o composición.
- Elección de fotografía: el preview temporal no es la elección guardada; la foto elegida aparece intacta en la entrega y el final.
- Destinatario vacío/desconocido, envío devuelto, mensaje incompleto, corrección y entrega válida sin repetir trabajo ya resuelto.
- Carta A enviada → borrador B editado; copia tras Finish; límite de historial; recarga; Replay con otra identidad de partida.
- Recorrido natural de Tab/Shift+Tab, movimiento reducido y ventanas normales/mínimas/máximas y desplazadas.

Mantén lo que ya funciona. Si encuentras una mejora clara en la legibilidad de las tres opciones de fotografía o en cómo inspeccionar la carta entregada, compara alternativas antes de implementarla. Puedes hacer un ajuste pequeño con una consecuencia demostrable; no agregues otro programa, un paso cosmético obligatorio, una nueva trama ni un rediseño completo.

Si consideras que una propuesta de Codex no mejora la experiencia, recházala con razones y conserva la solución mejor. No llames innovador a un cambio solo por sumar clics. Distingue decisiones expresivas, deducciones y acciones directas. La valoración humana de diversión sigue pendiente: no la sustituyas por una aprobación de otro modelo.

## 6. QA que también cubra lo dibujado

Prepara requisitos/diseño/tareas de esta iteración conservando las specs anteriores. Usa dependencias existentes.

- Conserva una reproducción antes y capturas comparables después del papel y la cabecera.
- Añade una comprobación dirigida a los límites del texto dibujado, con las fuentes realmente cargadas. No dependas solo del auditor DOM ni escribas una prueba que repita los mismos números incorrectos de la implementación.
- Inspecciona imágenes reales de Live, pausa, capturas, miniaturas y carta. Prueba DPR1 y2 y al menos una fuente de respaldo para el dibujo modificado. Documenta qué fue simulado y qué se observó realmente.
- Revisa1366×768,1440×900 y1920×1080; incluye mínimos permitidos. Las capturas deben demostrar márgenes y palabras completas, no solo ausencia de errores de consola.
- Ejecuta build, tests pertinentes y checks afectados. Repite el recorrido completo y las regresiones de integridad/recuperación cuando las modificaciones las afecten.
- Revisa de nuevo tu propia versión tras verla. Corrige los defectos que observes; no cambies un test para esconderlos y no cuentes una ruta automática como un usuario satisfecho.

Actualiza las instrucciones vigentes, README y kiro-usage con lo efectivamente ejecutado. Conserva la atribución real de Kiro y Codex. Registra modelo/esfuerzo/créditos solo si son observables; no inventes cifras. Respeta las bases ya verificadas y las licencias; verifica una fuente oficial si necesitas afirmar un requisito nuevo o mutable.

Entrega: cambios implementados; propuestas aceptadas/modificadas/rechazadas; capturas antes/después; resultados exactos; defectos y límites pendientes; y cómo abrir la compilación nueva de `/haunt.html` localmente. No declares listo para ganar ni 100% probado.

No automatices el escritorio nativo, instales software sin necesidad concreta, cambies cuentas, compres, publiques, hagas push o envíes a Devpost. Trabaja en la implementación local y su evidencia; no entregues únicamente otro plan.
