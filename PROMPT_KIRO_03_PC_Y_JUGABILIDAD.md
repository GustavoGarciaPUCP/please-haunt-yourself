# Kiro IDE / Opus — un solo caso, cuatro programas y un final que responde al inicio

Encargo consolidado por Codex, 6 de noviembre de 2026. Sustituye las versiones exploratorias anteriores de este mismo prompt; el borrador previo está archivado en docs/development/PROMPT_03_Pre_Narrative_Closure.md. Es una instrucción para el próximo trabajo real en Kiro IDE, no prueba de que ya se ejecutó. Usa el modelo realmente seleccionado y no inventes esfuerzo, crédito consumido o consenso con Codex.

## 1. Resultado y alcance de este incremento

El usuario quiere un escritorio ficticio de Halloween hermoso, comprensible sin programar, con programas reconocibles, acciones propias y una historia causal. PC es la plataforma principal. El arrastre real de las ventanas es obligatorio.

**Producto final recomendado:** un solo caso de cuatro programas, TERMINAL -> ECHO -> CANVAS -> POSTMAN -> TERMINAL. Cada programa transforma algo que el siguiente necesita. El regreso resuelve el problema presentado al principio.

**Implementación de este encargo:** las dos apps existentes, TERMINAL/ECHO, su relación real, arrastre y una escena global completa del cristal. Diseña desde ahora los contratos de CANVAS/POSTMAN y el cierre final, pero no los presentes como implementados ni añadas sus pantallas falsas. El resultado de dos apps es un checkpoint de desarrollo con progreso real, no un final de cuatro programas.

Puedes cambiar el modelo, las mecánicas y el recorrido existentes; no estás limitado a recolocar botones o conservar el viejo puzzle. Preserva el trabajo entregado y el prototipo histórico index/src/core. No hagas reset/clean para sustituir cambios del usuario.

**Tu papel es también dirección creativa.** Usa criterio propio: identifica el punto más débil de esta propuesta, plantea al menos tres mejoras concretas de alto valor y compara lo que gana el jugador, su claridad, personalidad, esfuerzo y riesgos. Elige e implementa las mejores que quepan en este incremento. No te limites a obedecer literalmente una escena si encuentras una forma mejor de lograr su propósito; tampoco sustituyas juego por más texto, efectos o menús.

Lo firme son las necesidades del usuario: PC, ventanas movibles, Halloween integrado en acciones, programas con identidad, comprensión sin programar, consecuencias reales y continuidad. La carta, sus detalles y las interacciones propuestas son una base coherente que puedes superar con razones. Si cambias una pieza estructural, actualiza juntas historia, datos, diálogos, escenas, pruebas y pitch. Resuelve elecciones rutinarias dentro de este alcance y continúa hasta una entrega comprobable; no te quedes esperando aprobación de cada detalle.

## 2. Lee estas fuentes con una prioridad clara

- AGENTS.md y .kiro/steering/project-contract.md: instrucciones actuales y alcance autorizado.
- **docs/development/23_The_Unsent_Letter_Narrative_Contract.md:** canon predeterminado de historia, causa de la campana, remitente/destinatario, datos y desenlace. Prevalece sobre las ficciones incompatibles de los borradores20–22.
- docs/development/19_PC_Gameplay_Reset.md: revisión de lo que se entregó realmente. Sus resultados anteriores no sustituyen comprobar tu propio baseline.
- docs/development/22_One_Case_Four_Programs_And_A_Three_Minute_Demo.md y PITCH.md: presupuesto de tiempo y distinción entre producto final e incremento.
- docs/development/21_The_Glass_And_The_Desktop_Arc.md: material, puesta en escena y coreografía del cristal; aplica el canon23 cuando difieran.
- El código real y .kiro/specs/terminal-experience-v2/: legacy-session/view, terminal-view, echo-view/scene, desktop, window-motion, estilos, guardado, cues y pruebas. La conexión antigua de ProcessSession/ECHO no equivale a integrar el nuevo caso de LegacySession.

No sigas acumulando propuestas incompatibles. Los documentos anteriores conservan procedencia e ideas; este prompt y el contrato23 definen el caso a construir. Producto, código, specs y entrega en inglés; este encargo interno permanece en español.

## 3. La historia concreta: The Unsent Letter

Mara dejó una sesión sin terminar en su escritorio de Halloween, fechada el 31 de octubre de 1987. El último trabajo era **entregar una imagen y una nota a la próxima persona que usara ese escritorio**. Como nunca se confirmó la entrega, la sesión vuelve a comenzar. Su línea repetida es “I'll finish in a minute.”

La aparición es el remanente visible de esa misma sesión. No inventes cuatro monstruos nuevos, una biografía distinta en cada app ni una muerte de Mara que no forma parte del caso. Cada programa tiene su perturbación, estética y capacidad propia dentro de un mismo trabajo pendiente.

La nota existe en los datos originales desde el inicio:

> FOR THE NEXT PERSON AT THIS DESK
>
> This picture is yours.
> Keep what matters.
>
> — Mara, 31 October 1987

El destinatario es el usuario guest de este escritorio ficticio: la próxima persona eres tú. Mara es la remitente. El final necesita que esa carta real llegue al buzón local de guest y su acuse vuelva al trabajo de TERMINAL. No es un correo a una persona real ni una respuesta del más allá.

Esto es la verdad del autor, no un discurso inicial que explica el misterio. Al entrar, muestra la repetición y el trabajo pendiente de imagen/nota, con una pista como “The address is on the note.” Deja que las herramientas vuelvan legible su contenido. Si alguien lo descubre antes al despejar el cristal, acéptalo: no censures información ni uses un flag de visita para forzar el orden. Comprender antes el destinatario no equivale a crear y entregar la carta.

## 4. Recorrido que debe conectar de principio a fin

1. **TERMINAL: observar y estabilizar.** Su propio historial añade “HELP ME.” y “I keep starting the same minute.” Un intento de terminar sin entrega, con reintento automático activo, hace sonar la campana y devuelve la aparición. Silenciar o parar la vista no resuelve el origen. Una intervención comprensible detiene de verdad el reintento: “The call has stopped. The letter is still waiting.”
2. **El progreso alcanza el cristal.** La misma sesión puede terminar su última impresión en vez de empezar otra vez. Vaho, silueta y mano aparecen en la superficie del escritorio. Es progreso intermedio; la entrega todavía está pendiente.
3. **ECHO: retener evidencia.** Compara fuentes/evidencia relevantes, descubre que la huella permanece al mover la ventana y captura el plano correcto. Una vista pausada, un enlace vivo y una impresión guardada deben comportarse de forma distinta. La impresión real conserva imagen, región despejada y escritura ya presente en la fuente.
4. **CANVAS, siguiente implementación: terminar la carta.** Aísla la escritura de la niebla y compón la nota original con la imagen elegida. El resultado es una carta legible y concreta, no un badge por visitar CANVAS. El encabezado revela a quién estaba destinada. No repitas el gesto de limpiar vaho como si fuera otro acertijo distinto: la operación aquí trabaja con capas y composición del contenido.
5. **POSTMAN, siguiente implementación: entregar al destinatario.** Su hilo muestra a Mara como remitente. Reply to sender es una interpretación plausible pero equivocada; la evidencia identifica al próximo usuario, guest. Una entrega correcta coloca esa carta exacta en Guest Inbox y genera un acuse local que corresponde a ella y a la petición.
6. **TERMINAL: cerrar el mismo trabajo.** El acuse válido completa la petición original. Último reconocimiento: “You were the next person. You can close the window now.” La mano suelta el cristal; la terminal deja de añadir mensajes fantasmales y sus comandos normales funcionan. El resultado conserva exactamente lo que el jugador eligió mantener.

El primer objeto y la última confirmación deben ser reconocibles como la misma petición. No añadas un jefe final independiente, llaves de colores, cuatro tutoriales obligatorios ni una cinemática que deshaga el avance para empezar lo mismo otra vez.

### 4A. Una sola causa de la campana

TERMINAL produce el retorno cuando un intento de terminar sin acuse válido reemite la petición mientras el reintento está armado. Ese evento tiene identidad única. ECHO puede mostrarlo/grabarlo; no lo produce por cada frame ni por reproducir una grabación. La campana no es un programa nuevo ni una causa sobrenatural que cambia según la escena.

Con reintento detenido, la petición sigue abierta pero no debe revivir por cambiar de pestaña, minimizar, pausar ECHO o ver una captura. Un error de envío tiene feedback propio; no reinicia todo el misterio ni contradice “The call has stopped.”

### 4B. Presencia dentro de cada aplicación

La escritura fantasmal responde a eventos reales, no es spam aleatorio. Por ejemplo:
- Vista pausada y reintento activo: “You stopped the picture. Not the call.”
- Reintento realmente detenido: “The call has stopped. The letter is still waiting.”
- Fuente de ventana vacía retenida: “The window is empty. The mark is on the glass.”
- Escritura borrada en CANVAS: “Not the words.” y una previsualización realmente incompleta.
- Ruta de respuesta devuelta: “That went back to the sender.”

No escribas encima del input del jugador, robes foco, fuerces scroll si lee mensajes previos ni ejecutes sus textos como código del SO. Usa líneas acotadas y revisables. Con movimiento reducido, texto completo; audio opcional. Después del cierre, el último reconocimiento queda como historial y termina la escritura autónoma.

Cada app debe reconocerse por su diseño y operación: TERMINAL con prompt/transcript/caret; ECHO con monitor/fuentes/evidencia/captura; CANVAS con superficie de trabajo/capas/composición; POSTMAN con hilo/remitente/destinatario/buzón. No uses el mismo panel de tarjetas con cuatro títulos distintos.

TERMINAL debe funcionar como consola del juego: input utilizable, historial, cursor reconocible y comandos admitidos como echo, con resultados acordes al estado. El acertijo se desarrolla mediante la propia aplicación y modifica su comportamiento. La inspección PID, señales y términos técnicos queda opcional en Under the hood; las acciones principales y Are you okay? se pueden usar sin escribir comandos. El mismo criterio se aplica a la captura de ECHO: nada de un programa decorativo junto a un minijuego independiente.

En el primer minuto, prioriza una anomalía comprensible, un intento que permita observar la causa y una acción del jugador con efecto reconocible. Usa una sola acción principal relevante, objetos con etiquetas claras al foco/hover y pistas progresivas. Una guía inicial breve puede destacar un control y dejar probarlo; debe poder omitirse y cerrarse. Evita ocho acciones simultáneas, explicar de golpe cuatro interfaces o resolverlo todo con flechas que indiquen exactamente la respuesta.

### 4C. Necesidad de las cuatro contribuciones

El trabajo requiere imagen y nota entregadas: ECHO obtiene la impresión, CANVAS termina su contenido, POSTMAN lo entrega y TERMINAL confirma. La impresión de trabajo no es automáticamente una carta terminada; un enlace vivo no es una imagen pasiva.

No inventes texto que no estaba en la fuente ni supongas OCR, píxeles recuperables o servicios de correo que no has implementado. Una impresión con capas es un formato interno de la escena del juego y debe presentarse con una previsualización comprensible. El payload entregado tiene que coincidir con lo visible.

Aplica la prueba de quitar una operación: si sin ella el mismo contenido llega al mismo desenlace, su etapa no está justificada. Evita dar a ECHO o POSTMAN un editor equivalente a CANVAS solo para mantener después otro paso decorativo. Si encuentras una mejora estructural, explícala y actualiza toda la cadena.

Permite abrir cualquier app antes de tener su entrada. Debe mostrar qué falta y una forma de volver, no inventar contenido completo ni bloquear ventanas para imponer una historia lineal. Usa traspasos contextuales: Open in CANVAS sobre la impresión real, Compose with this sobre la carta y Return to the request sobre el acuse.

### 4D. Crítica real de Opus, sin conversación inventada

Codex ya fija una historia predeterminada para resolver las ambigüedades. No vuelvas a repartir remitente, destinatario y causa en tres tramas inconexas. Compara alternativas de interacción dentro de este caso, elige la mejor y construye.

En design-review.md registra qué aceptas, modificas o rechazas del contrato23 y por qué. Cuestiona sobre todo si la fuente correcta es deducible, si CANVAS permite autoría real y si el descubrimiento de guest tiene recompensa. No cuentes cada animación o panel como acertijo.

Puedes proponer una modificación estructural mejor, pero actualiza coherentemente el contrato narrativo, estados, textos, artefactos y pitch; no cambies silenciosamente solo una escena. Tu resultado será la respuesta a Codex para una revisión posterior. No afirmes consenso, aprobación independiente, usuarios entrevistados ni premios previstos.

### 4E. El gran momento del cristal

Conserva la propuesta de vaho nocturno, silueta y mano, ligada al reintento que se detuvo. La huella permanece en el plano del cristal cuando se mueve la ventana; el arrastre responde inmediatamente. Una región despejada por el jugador puede permanecer en la captura final. No exijas una forma exacta, habilidad de dibujo ni reflejos.

ECHO necesita fuentes coherentes: una captura de una ventana vacía no incluye mágicamente una mano que está fuera de ella. La superficie global y las fuentes leen el mismo modelo. Componer/exportar esa escena no significa acceder al monitor real, la cámara o el SO del usuario.

Haz que se sienta cristal húmedo: densidad desigual, trazos despejados, palma difusa y contacto legible de dedos. Conserva la identidad carbón/petróleo/hueso/cobre. Una sola aparición es el foco; evita humo genérico, flashes y una mano que parezca un icono pegado.

La guía21 propone un revelado raro de unos dos segundos, con controles utilizables desde el principio. Úsalo como punto de partida y revisa un video real. Mantén texto, barra superior y salida legibles; no desenfoques todo el root para fabricar atmósfera. Omitir/ocultar la presentación no pierde progreso ni evidencia. En movimiento reducido usa el mismo estado estático.

La mano aparece como hito intermedio y se libera después del acuse final: significados distintos. El incremento actual implementa el hito y su evidencia, sin simular el cierre de cuatro apps.

### 4F. Duración y presentación

Objetivos editoriales sin medir: primera partida de unos 6–9 minutos; ruta conocida mostrable con acciones reales en unos 110 segundos; video alrededor de 2:50 con margen hasta 2:55. No impongas cuenta atrás, esperas obligatorias ni velocidad para fabricar esa duración.

PITCH.md dedica 25 segundos a promesa/público, 110 al recorrido y cierre, 25 al uso genuino de Kiro, 10 a conclusión y 5 a margen. El documento22 contiene las fuentes de la norma y de las duraciones de videos ganadores; no equipares duración del video con tiempo de juego.

Deja diálogos extra, inspección técnica y experimentos posteriores fuera del camino obligatorio. Si no cabe el recorrido, simplifica antes de hablar más rápido. No crees un modo demo que salte los estados ni sustituyas el resultado funcional por una película fija. Marca con honestidad los cortes si editas una grabación.

## 5. PC y arrastre real, obligatorios

Implementa mover TERMINAL y ECHO manteniendo el botón principal sobre el área vacía de su barra superior. Captura y libera el puntero correctamente; cancela pérdida de captura, cierre e interrupción. Botones, inputs, enlaces y selección no inician drag. Eleva/focaliza la ventana adecuada.

Mantén apertura/cierre/minimizar/restaurar, estados de juego y foco fiables. Posición y transform de animación no deben sobrescribirse. La ventana sigue directamente al cursor, sin animación que lo persiga. El gesto de limpiar el cristal no puede robarle la captura.

Mantén posiciones recuperables al cambiar tamaño de navegador o escena. Ofrece alternativa de teclado y una acción visible para ordenar/restaurar posiciones. Comprueba geometría real con pointerdown/move/up; no basta cursor: grab.

Compón y verifica en 1366×768, 1440×900 y 1920×1080: textos cómodos, escena a escala intencional, controles accesibles y taskbar libre. Evita una escena pequeña rodeada de espacio accidental o usar 11px para todo. Pantallas pequeñas mantienen compatibilidad razonable; no vuelvas a priorizar el móvil.

## 6. Estado, artefactos y persistencia

Una petición mantiene su identidad durante el caso, independientemente de PID, ventana, audio y animaciones. Separa reintento detenido, escena retenida, carta terminada, entrega confirmada y petición cerrada.

La impresión, carta y acuse deben conservar procedencia/versiones y corresponder al contenido actual. El final se deriva de una entrega válida al guest correcto y su aceptación; no de cuatro flags de apps visitadas. Un acuse viejo no completa otra carta. Define transacciones de Undo y consecuencias de editar algo ya entregado.

Un final antiguo de TERMINAL no completa la futura cadena. Migra/versiona sin borrar todo localStorage ni datos ajenos. Reanudar, cerrar, minimizar, Undo y repetir deben conservar estados coherentes. Las animaciones no deciden el progreso; eventos y vistas no duplican retornos/entregas.

La opción de no guardar recuerdo personal, si existe, no borra el registro entregado mientras mantienes un acuse que lo certifica. Si dos finales obligan a mentir sobre los datos, entrega un final completo claro y una eliminación posterior explícita.

## 7. Ejecuta este incremento y deja la integración preparada

1. Inspecciona el código/UI y conserva el baseline, incluido trabajo sin commit. Distingue la escena vieja de ECHO de lo que integras ahora.
2. Escribe .kiro/specs/pc-agency-v3/requirements.md, design.md, tasks.md y design-review.md. Incluye la historia23, acciones/estados, datos compartidos, voces, arrastre, guardado, contraste antes/después y una tabla de coreografía. next-programs.md especifica CANVAS/POSTMAN y el acuse final, sin incógnitas sobre quién envía a quién o qué carta es.
3. Implementa el checkpoint de TERMINAL/ECHO, la escena global y el arrastre. El resultado debe cambiar lo que el jugador descubre, hace y retiene; no solo la apariencia. Sigue hasta tener un recorrido comprobable, no te detengas al escribir una propuesta.
4. Actualiza instrucciones/status con precisión. El trabajo actual puede detener el reintento y crear la impresión, pero debe decir que la carta sigue pendiente; no enseñar una victoria total ni pantallas inexistentes.
5. Deja las tareas de integración de los dos programas siguientes ligadas a requisitos y criterios de aceptación concretos. Ningún cuarto programa puede aparecer solo porque faltaba rellenar un cupo.

## 8. Verificación y entrega honesta

- Verifica arrastre de ambas ventanas, salir del marco, controles sin drag accidental, teclado/reset, resize, cambios de escena, foco y minimizar/cerrar/restaurar durante movimiento.
- Verifica una fuente incorrecta y su recuperación, diferencia entre pausa/mute y reintento, impresión real, ghost output condicionado, escena global/huella fija y correspondencia de captura con sus datos.
- Revisa interrupción, Undo, replay explícito, persistencia/migración, página oculta, movimiento reducido y audio desactivado sin duplicar eventos ni perder progreso.
- Mantén checks de infraestructura. Si retiras el puzzle viejo, reemplaza sus pruebas con escenarios nuevos justificados; no fuerces su conservación por un test ni borres un fallo para fabricar verde.
- Ejecuta build antes de los recorridos contra dist, secuencialmente. Un viewport pequeño no prueba zoom real, un AudioContext falso no prueba sonido audible y un agente no es un usuario humano.
- Recorre sin documentación: ¿qué se repite?, ¿qué detuviste?, ¿por qué aparece la mano?, ¿qué conserva ECHO?, ¿qué falta para la carta?, ¿quién es guest y qué cerrará el caso? Para el resto aún no implementado, marca que el recorrido es de papel.
- Revisa capturas/video PC y corrige composición/material/ritmo; no deduzcas una experiencia excelente por número de tests, líneas o efectos. Usa un identificador discreto de versión para que el usuario reconozca el build correcto.
- Entrega cambios reales, specs, resultados, limitaciones y un recorrido reproducible. Explica qué se implementó y qué queda pendiente. Separa tiempos estimados de medidos y contribución de Kiro de la de Codex.

En tu respuesta final incluye: las mejoras propias que elegiste y descartaste; una comparación de acciones/consecuencias antes y después; cómo reconocer y abrir el build correcto de /haunt.html; el recorrido del checkpoint, un error plausible y su recuperación; capturas o video PC reales; archivos/specs/checks ejecutados; y lo que falta para CANVAS/POSTMAN y el cierre global. Si reutilizas el servidor local, comprueba la URL/versión que realmente sirve después del build. No pidas borrar toda la caché o los datos del navegador como sustituto de una migración o identificación de versión correcta.

Sin publicación, git push, envíos, compras, cambios de cuenta/región, nuevas dependencias innecesarias ni control del escritorio del usuario. Trabaja en el stack existente de TypeScript/HTML/CSS/SVG/canvas y navegador, sin framework nuevo, código peligroso del SO, webcam, IA en tiempo de juego ni credenciales/razonamiento privado en el repositorio.

Dedica el tiempo necesario a implementar y corregir. El criterio de cierre es un checkpoint funcional coherente con esta historia y la integración futura bien especificada; no tiempo consumido, garantía de premio o una afirmación de que ahora todo es sobresaliente.
