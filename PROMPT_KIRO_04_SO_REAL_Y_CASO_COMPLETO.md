# Kiro IDE — SO convincente, interacción clara y The Unsent Letter completo

Preparado por Codex el 7 de noviembre de 2026 tras revisar el v3 real del participante. Es el siguiente encargo propuesto para ejecutar en Kiro IDE, no un trabajo ya realizado. El prompt03 produjo el checkpoint de dos apps; no vuelvas a ejecutar su encargo antiguo como si v3 no existiera.

## 1. Objetivo y alcance

Revisa críticamente, mejora e implementa un escritorio de Halloween convincente y el caso completo de The Unsent Letter. El usuario vuelve a señalar que la pantalla inicial parece una web y que la experiencia aún necesita una mejora considerable.

V3 aporta trabajo real que debes preservar: arrastre, foco/cancelación, historia compartida, cristal editable, ECHO como visor de ese cristal, capturas pasivas y guardado. La revisión de Codex confirmó build, 84 unitarias y 67 recorridos existentes. Eso no certifica diversión, comprensión ni un diseño sobresaliente.

**Este nuevo encargo amplía el incremento anterior:** termina CANVAS, POSTMAN y el acuse final, además de mejorar el escritorio y las dos apps actuales. La restricción de implementar solo dos apps pertenecía al prompt03 ya entregado. No continúes aplazando el final tras otra ronda de efectos sobre el mismo checkpoint. Trabaja por fases verificables sin fabricar pantallas o funciones inexistentes.

No cambies de proyecto ni vuelvas a un teatro separado, al viejo mirror/watchd o al prototipo paper-bridge. No añadas quinto/sexto programa para aparentar amplitud. Conserva la historia y el repositorio; el objetivo es un caso completo, no un SO general con funciones ficticias.

## 2. Fuentes y baseline real

Lee:

- AGENTS.md y .kiro/steering/project-contract.md, con sus notas más recientes.
- docs/development/24_V3_Critical_Review_And_Real_OS_Direction.md: evidencia, problemas reproducidos y prioridades.
- docs/development/23_The_Unsent_Letter_Narrative_Contract.md: historia coherente, remitente, destinatario y cierre.
- .kiro/specs/pc-agency-v3/: lo que tú/Kiro realmente implementaste, sus decisiones y next-programs.md.
- PITCH.md y review22: presupuesto de demostración y límites de las comparaciones publicadas.
- Código actual: desktop/window-drag, legacy-session/view, terminal-view, echo-studio/view, glass-model/render/view, case-save, first-run, estilos y pruebas.

Abre y recorre la UI actual en PC antes de editar. El preview revisado estaba en http://127.0.0.1:5174/haunt.html y servía v3-checkpoint. Comprueba tu origen y versión reales; no culpes a la caché de decisiones que siguen iguales.

Hay trabajo de Kiro y Codex sin commit. No hagas reset/clean, no restaures automáticamente los archivos retirados y no sustituyas toda la aplicación por una demo nueva. La atribución actual distingue quién hizo cada cosa.

## 3. Criterio propio y dirección creativa

No seas un ejecutor literal de todas las ideas de Codex. Identifica lo más débil, compara tres mejoras de alto valor y elige una solución coherente por problema. Explica efectos para el jugador, comprensión, personalidad, esfuerzo y riesgos. Evita puntuaciones subjetivas que solo declaran excelente el resultado.

La base narrativa es una recomendación ya coherente. Puedes mejorar interacciones, tono, composición y mecanismo si encuentras algo superior, pero una modificación estructural debe actualizar historia, datos, textos, guardado, pruebas y pitch juntos. No vuelvas a inventar tres destinatarios o tres causas de la campana.

Antes/después debe comparar acciones, decisiones, datos retenidos y consecuencias, además de apariencia. Más líneas, más modelos, más créditos, más animaciones o más botones no son criterios de calidad.

## 4. Primero corrige los defectos reales

### Acción de la campana fuera del área visible

En 1440×900, tras seleccionar Bell, Stop the call estaba entre y=753.58 y793.58 mientras la ventana terminaba en750. El footer estaba entre693 y737. El clic automatizado lo encontraba gracias a su auto-scroll; una persona no lo ve en la composición inicial.

Diseña un inspector contextual visible al seleccionar el objeto: reutiliza/sustituye espacio o distribuye escena e inspector cuando haya ancho. No apiles otro panel debajo de toda la narración, no reduzcas texto para hacerlo caber y no dependas de auto-scroll implícito. La causa, intervención y efecto deben seguir siendo comprensibles.

### Selector de fuentes de ECHO

Los dos botones role=radio tienen tabIndex0 y ArrowRight no cambia foco/selección. Implementa radios nativos, el patrón de teclado de radio-group o una alternativa semántica correcta. No declares que todo el teclado está resuelto porque Enter sobre un botón funciona.

### Evidencia parcial frente a carta completa

V3 acepta como impresión útil 60% de mano, dos líneas legibles y figura despejada, pero la carta final requiere la nota completa. No traslades ese descubrimiento a POSTMAN varios pasos después ni inventes las líneas que faltan. Resuelve el contrato de captura del apartado6 antes de implementar CANVAS.

## 5. El inicio debe sentirse como un SO real

Adopta un lenguaje coherente de estación de trabajo HAUNT OS. Codex recomienda:

- Una barra inferior con launcher, apps abiertas y bandeja/reloj.
- Ventanas con icono/título, controles consistentes y menús propios de la app.
- Wallpaper nocturno intencional y tranquilo, iconos de una misma familia y documentos reales del caso.
- Progreso a través de una notificación/archivo de trabajo pendiente y estados dentro de las apps, no un gran titular de producto sobre el fondo.

Elimina de la composición principal el hero Please haunt yourself, párrafos repetidos de misión y las etiquetas continuas game shell/v3 checkpoint/not in this build. Conserva información honesta de versión, alcance y procedencia en un About/Recovery information real. Durante desarrollo no finjas que algo funciona; al completar este encargo las cuatro apps deben existir.

Evita mezclar el símbolo command de Mac, una barra global de un sistema, controles de otro y una navegación web. Puedes proponer otra dirección coherente, pero elige una; el objetivo no es copiar Windows o macOS literalmente.

Una transición inicial breve Restoring last session puede servir de entrada. Debe poder omitirse y no retrasar las reaperturas. No añadas login real, contraseña, múltiples usuarios ficticios, Wi-Fi que no funciona ni settings de relleno. La sensación de sistema debe proceder de interacciones y estructura auténticas.

La primera anomalía debe destacar dentro de algo verosímil: una línea que TERMINAL no debería escribir, una notificación que vuelve o un rastro que no se mueve con la ventana. Si todo grita Halloween desde el primer píxel, la aparición pierde contraste.

Usa la base carbón/petróleo/hueso/cobre con mayor intención. Sistema legible en sans; TERMINAL mono propio; la carta humana tiene su material propio. Ajusta cuerpo/acciones aproximadamente a14–16px y secundarios a12–13px cuando corresponda. No uses11px como objetivo universal ni conviertas una preferencia de tamaño en una falsa certificación WCAG.

### Ventanas que responden como ventanas

Preserva el arrastre ya logrado. Añade maximizar/restaurar y resize acotado, con geometría de restauración, teclado, foco y workspace fiables. Verifica su relación con las fuentes/encuadre de ECHO y la posición normalizada del cristal. No permitas que el resize destruya capturas ya retenidas ni que una animación sobrescriba la posición.

Usa solo affordances que funcionan. No hace falta implementar un sistema operativo entero.

### Archivos que tengan contenido

Un archivo del trabajo abre esa petición; una captura/negativo abre ese artefacto; una carta abre su versión de CANVAS; un recibo abre su entrega de POSTMAN. Los iconos no pueden ser pegatinas que solo cambian un texto. No construyas un gestor de archivos completo si estos pocos objetos y sus asociaciones resuelven el flujo.

## 6. ECHO: conserva su idea, reduce la microgestión

Mover la propia ventana para encuadrar el cristal es una contribución interesante de v3. Conserva esa conexión espacial si el resultado se comprende; no la conviertas en una búsqueda de porcentajes ocultos de mano, palabras o zona despejada.

**Propuesta preferida de Codex:** una captura guarda un negativo completo por capas de la fuente seleccionada y, por separado, el encuadre elegido para la fotografía. El visor permite decidir la foto; el negativo conserva los datos de esa fuente en ese instante y CANVAS permite trabajar con ellos.

Esto cambia la promesa actual de guardar solo el rectángulo del monitor. Muéstralo de forma clara con una vista del negativo completo y del marco elegido. Ejemplo de copy que puedes mejorar: Full image kept. This frame becomes the picture. No ocultes la diferencia al jugador.

Contrato mínimo:

- Fuente, petición y versión de origen reales.
- Copia independiente del estado capturado, sin leer después un cristal vivo que cambió.
- Datos visuales, tinta/escritura y máscara de niebla que estaban en esa fuente.
- Encuadre elegido como edición separada.
- Resultado estable al recargar.
- Una fuente Session window vacía o anterior al hito no recibe mágicamente la escritura del cristal.

Un negativo por capas puede conservar información oculta por su máscara porque esa información estaba realmente en sus canales al capturarlo. No inventes contenido después ni lo extraigas de constantes globales para hacer parecer completo un negativo que no lo contenía.

Los antiguos prints v3 solo conservaban su recorte. No los conviertas retroactivamente en negativos completos. Migra conservándolos como capturas limitadas; ofrece una nueva exposición del caso actual sin borrar la historia ni reactivar el bucle.

Si encuentras una solución mejor que negativo+encuadre, demuéstrala con una ruta completa y datos honestos. No conserves el recorte frágil por inercia ni añadas tres mecanismos de captura simultáneos.

Mejora el visor: relación espacial visible, controles propios de captura y una bandeja legible. La salida no debe acabar en listas de conteos que compiten con una imagen diminuta. Si hay límite de almacenamiento, explícalo, facilita reemplazar/descartar con Undo y evita penalizar cada experimento equivocado.

Comprueba una captura útil usando solo teclado. El actual botón que limpia un óvalo central no demuestra una ruta equivalente a limpiar selectivamente donde está la figura. Si la selección de región es necesaria, ofrece un control accesible que permita elegirla y produzca los mismos datos. La alternativa no debe usar un comando secreto que declare éxito.

## 7. Una presencia más fuerte y una escena mejor compuesta

La base actual usa un fantasma caricaturesco que se amplía detrás de una máscara de vaho. No basta con aumentar blur, tamaño y gotas.

Propón una expresión visual coherente con el caso: presencia formada por salida repetida, reflejo parcial y huella de presión. Debe reconocerse como la misma entidad por su gesto, rastro y contexto; no es obligatorio repetir un mismo sprite de ojos grandes en todas las escalas.

Compón el momento con un foco principal. Mano con anatomía/contacto legibles; silueta secundaria; humedad con densidad variable y regiones despejadas; interfaces legibles. Un estilo ilustrado deliberado vale más que un fotorrealismo débil. Revisa el efecto en silencio, a tamaño PC y en movimiento.

La llamada detenida permite que la misma sesión termine su impresión una vez: hito intermedio. La entrega aceptada libera la presión del cristal: final. Ambos hechos deben tener tratamientos distintos. No hagas aparecer un villano nuevo ni reinicies el misterio como castigo por progresar.

Nada de flashes, gritos aleatorios, cada clic disparando una escena de pantalla completa o secuencias que bloquean la salida. Preserva movimiento reducido, sonido opcional, cancelación, foco y control inmediato.

## 8. TERMINAL debe seguir siendo TERMINAL

Consola del juego funcional: input, cursor, historial, comandos admitidos y resultados basados en el caso. El output fantasmal interviene ahí; no se limita a un banner encima de un manual.

Reduce explicación repetida. Un estado autoritativo del trabajo, una anomalía y ayuda contextual bastan mejor que cuatro versiones de la misión en fondo, banner, tarjeta y transcript.

Conserva los eventos claros: muffle solo cambia sonido/evidencia de campana; detener el reintento modifica el trabajo; ECHO observa/retiene y no produce nuevas llamadas. La campana es una introducción breve al caso; no la hagas más larga con candados artificiales para contar otro acertijo.

La vista interior puede utilizar la metáfora de sesión/impresión dentro del programa, pero su composición debe pertenecer al lenguaje del mismo software. Evita otra página de cuento con gran título y cuatro hotspots pegada dentro de una terminal decorativa.

La primera visita debe permitir una acción relevante. La guía actual pide abrir TERMINAL cuando ya está abierta: reemplázala por asistencia breve, contextual, omisible. No enseñes cuatro apps al entrar ni hagas obligatoria la jerga PID/TERM/KILL. Under the hood sigue opcional.

## 9. Completa CANVAS, POSTMAN y el final real

Sigue el contrato23, ajustando el formato de captura conforme al apartado6:

**CANVAS**

- Recibe el negativo/captura real retenido en ECHO.
- Tiene superficie de trabajo, capas, vista del resultado y operaciones con efecto.
- Separa la escritura capturada de la niebla y permite componerla con la foto elegida.
- Conserva el texto original de Mara y los cambios reales de encuadre/composición del jugador.
- Alterar/borrar la escritura cambia previsualización y payload; Undo recupera la edición.
- No es otro selector de fuentes ni otro botón Capture; no repite el gesto de limpiar el cristal como un puzzle diferente.
- Compose with this produce una carta terminada y abre POSTMAN en el contexto correcto.

**POSTMAN**

- Tiene hilo, remitente/destinatario, borrador, inbox/returned y resultado verificable.
- Mara es la remitente. FOR THE NEXT PERSON AT THIS DESK identifica al guest actual.
- Reply to sender produce un retorno local comprensible, sin reiniciar el trabajo de las otras apps.
- Deliver to Guest Inbox guarda esa carta exacta y genera un acuse de la misma versión/petición.
- El correo es enteramente ficticio/local; no uses email real ni finjas una respuesta de otra persona.
- Return to the request vuelve con ese acuse a TERMINAL.

**CIERRE**

- TERMINAL valida petición, versión, contenido y destinatario del acuse real.
- No se completa por cuatro flags de apps visitadas ni una animación terminada.
- Último reconocimiento: You were the next person. You can close the window now.
- La mano libera el cristal. El prompt y las herramientas normales quedan utilizables.
- La carta en Guest Inbox y la imagen elegida pueden inspeccionarse después. Una elección posterior de recuerdo personal no puede mentir sobre el registro entregado.
- No hay auto-replay del mismo susto después de ganar ni video fijo usado como final falso.

El objetivo es una sola carta que atraviesa herramientas nativas, no cuatro llaves de color o cuatro salas inconexas. El destinatario puede deducirse temprano: no censures información para fabricar una sorpresa; la recompensa también está en producir y recibir esa carta real.

## 10. Persistencia y evolución de datos

Diseña un formato de caso versionado para la integración, conservando lo válido de v3. No borres todo localStorage ni archivos ajenos. No uses un viejo final de TERMINAL o un print incompleto para fingir una carta entregada.

Separa petición/PID, llamada, aparición, fuente, negativo, crop, carta, entrega, acuse, ventanas y presentación. Define transacciones de Undo/replay y cambios después de entregar. Una carta editada no usa el acuse de otra versión.

Muestra la migración de forma breve y entendible. Permite retomar sin reemitir eventos ya consumidos, duplicar entregas o reproducir la revelación cada vez que se abre una ventana.

## 11. Secuencia de ejecución

1. Inspección real y baseline; reproduce los dos problemas de control de la revisión24.
2. Escribe .kiro/specs/os-case-v4/requirements.md, design.md, tasks.md y design-review.md con decisiones aceptadas/modificadas/rechazadas, formato de captura, migración y final verificable. Define una dirección de SO concreta antes de escribir CSS.
3. Corrige visibilidad del inspector y teclado. Establece escritorio/ventanas/tipografía y compruébalos en PC.
4. Implementa el contrato de negativo/encuadre y su migración; prueba fuente incorrecta y contenido retenido.
5. Mejora la presencia y su puesta en escena sin romper el modelo o los inputs.
6. Implementa CANVAS, POSTMAN y el acuse final sobre los mismos artefactos. No te detengas en specs, un nuevo escritorio bonito o un tercer checkpoint sin cierre.
7. Recorre la ruta completa, corrige contradicciones/fricciones y actualiza documentación/pitch con lo que realmente existe.

Puedes ajustar el orden si evitas dependencias rotas. No ejecutes pruebas de navegador mientras un build reemplaza dist. Mantén el prototipo histórico y pruebas relevantes. Las nuevas comprobaciones deben cubrir riesgos reales, no replicar CSS o detalles internos sin valor.

## 12. Pruebas y criterio de salida

- Tres PC: 1366×768,1440×900,1920×1080. Desktop, primera acción, inspector seleccionado, dos ventanas, tamaño maximizado/restaurado y caso final.
- Acción de Bell visible y alcanzable sin el auto-scroll de un locator; foco/teclado correctos para fuentes.
- Drag, resize, maximizar/restaurar, cierre/minimizar, orden, foco e interrupción conservan estado y posiciones recuperables.
- Captura/negativo/crop coherentes; contenido pasivo que no cambia al editar después el cristal.
- Ruta CANVAS/POSTMAN con payload real, un error plausible y recuperación; acuse viejo, receptor incorrecto y carta incompleta no producen cierre falso.
- Ruta completa con puntero y con teclado. Movimiento reducido y sonido apagado conservan evidencia y acciones.
- Reload/migración/almacenamiento no disponible/Undo/replay controlados; no duplicar entregas o progreso desde animaciones.
- Build, unitarias y recorridos pertinentes. Si retiras reglas v3, cambia sus pruebas con justificación y conserva cobertura de infraestructura.
- Capturas y secuencia PC de antes/después. No recortes para esconder problemas ni confundas una grabación de frames con un video reproducible.

Las observaciones de Codex y los agentes son informadas por el código; no sustituyen una persona que no programe. Entrega un protocolo corto de primera visita y declara si no hubo humanos disponibles. No simules entrevistas, disfrute, screen-reader support o audio audible.

## 13. Ritmo, Kiro y entrega

Conserva como objetivos editoriales, no mediciones: primera partida de unos6–9min; ruta conocida de unos110s; video alrededor de2:50 con margen hasta2:55. No impongas esperas para fabricar duración. Actualiza PITCH.md si cambia el recorrido. El final debe poder verse sin depender de que el jurado haga toda la exploración opcional.

Usa las funciones reales de Kiro que aporten valor: specs, steering y verificaciones; hooks/agentes solo si resuelven algo concreto y existen en tu entorno. Registra lo que produjo esta ejecución y qué ya era Codex/Kiro previo. No inventes modelo, esfuerzo o créditos, ni uses herramientas solo para engordar una lista.

Entrega: decisiones propias y críticas; comparación de acciones/consecuencias; versión/URL local; pasos de una ruta completa y una equivocada; capturas/video reales; archivos/specs/tests ejecutados; migración; límites restantes; tiempo medido frente a estimado; y contribuciones auténticas. Si algo no se implementó, dilo sin una falsa pantalla de éxito.

Usa el stack local existente. Sin nuevas dependencias innecesarias, framework nuevo, webcam, IA en tiempo de juego, procesos reales del SO, secretos, compras/cambios de cuenta, publicación, git push o submission. No tomes control del escritorio del participante. Revisa mediante herramientas de navegador/terminal en el proyecto.

La entrega debe ser una experiencia completa, coherente y visualmente intencional que el participante pueda jugar. No cierres con garantía de premio, número de líneas o una afirmación de que ahora ya es sobresaliente.

## 14. Ampliación de consistencia — conservar todo lo anterior

El participante pidió una segunda pasada sin borrar las mejoras previas. Esta sección añade precisión al encargo completo; los apartados1–13, la revisión24 y sus prioridades se mantienen. Lee también docs/development/25_Consistency_Across_The_Four_Programs.md. Es un contrato propuesto para v4, no una afirmación de que ya esté implementado.

### 14.1. Decisiones diferentes, un mismo trabajo

TERMINAL permite detener la repetición real; ECHO identifica la fuente y retiene un momento; CANVAS transforma esa captura en la carta; POSTMAN decide y ejecuta su ruta; TERMINAL acepta la entrega y termina la sesión. Cada programa tiene una decisión/operación propia y transmite su resultado concreto al siguiente.

No añadas otro programa, otro acertijo de relleno o una obligación de equivocarse para cumplir una cuota. Un jugador que deduce pronto al destinatario puede actuar pronto. Abrir las apps fuera de orden muestra estados honestos y caminos al dato que falta, sin otorgar contenido ficticio.

### 14.2. El negativo completo no vuelve irrelevante el encuadre

La captura conserva material de la fuente; el marco decide qué fotografía aparece en la carta. Muestra ambas vistas. Una huella o un reflejo legible de esa misma presencia pueden ser elecciones válidas. Si solo se encuadra niebla vacía, indícalo y permite reencuadrar el negativo retenido sin otra exposición.

No exijas que toda la mano, cara y cinco líneas quepan en un recorte. La escritura es una capa capturada aparte. Usa feedback visible sobre el sujeto, sin porcentajes secretos. Una fuente equivocada sigue sin contener la escritura del cristal; una captura anterior no se reescribe al tomar otra. Los prints v3 limitados no ganan datos retroactivamente.

### 14.3. Los verbos tienen un significado estable

Fija el vocabulario en la spec y úsalo en todas las apps:

- Pause detiene la vista, no TERMINAL.
- Muffle silencia, no termina el trabajo.
- Capture crea una copia pasiva de la fuente, no envía nada.
- Use this capture selecciona material para una carta, no certifica entrega.
- Save draft guarda una revisión editable, no la envía.
- Compose in POSTMAN prepara un borrador con esa carta, no lo manda automáticamente.
- Reply prepara una respuesta dirigida al remitente; el retorno equivocado ocurre si luego se pulsa Send a esa ruta. No codifiques Reply como envío inmediato.
- Send confirma el intento hacia el destinatario elegido.
- Return to the request abre TERMINAL con el acuse disponible.
- Finish session acepta ese acuse y cierra el trabajo original; Close window solo cierra la ventana.

La jerga de formatos, hashes, PIDs y versiones puede permanecer en un inspector secundario. El jugador trabaja con captura, fotografía, escritura, carta y entrega.

### 14.4. Carta editable, entrega inmutable y final estable

CANVAS contiene un borrador. Send crea una instantánea de entrega con su contenido, revisión y destinatario; el acuse pertenece a esa instantánea.

Ejemplo obligatorio: se entrega A, luego se edita un borrador B. Guest Inbox sigue mostrando A y el acuse A sigue certificando A. Ese acuse no puede certificar B. Editar o recortar una nueva copia no revoca silenciosamente la entrega A ni reabre un caso terminado.

Esto precisa, sin eliminar, la regla previa de que un acuse viejo no certifica otra versión. Si implementas reemplazo/retirada antes del cierre, debe ser una acción explícita que identifica la entrega afectada y conserva el borrador. No construyas una sincronización de correo general solo para este caso.

Al componer, la carta retiene los datos que necesita de su captura. Descartar una miniatura de ECHO no puede romper una carta o entrega que ya dependa de ella. Retomar una exposición, sustituir una fuente, editar una copia y borrar una vista son acciones distintas y visibles.

La entrega y su acuse se confirman juntos. Doble clic en Send, remontar una vista, animar o recargar no duplica el envío. Un mensaje incompleto o de ruta errónea no pone la petición en Ready to finish, aunque se conserve un registro de ese intento.

Después de un final aceptado, ver/editar una copia no hace volver al fantasma. Replay es una acción explícita y crea otra identidad de partida; un acuse archivado no completa la nueva. Reload continúa la partida actual.

### 14.5. Un solo mundo espacial y un estado narrativo compartido

Define las capas una vez: superficie compartida del escritorio/cristal, ventanas/controles utilizables y proyección de esa superficie en ECHO. El visor no hace una captura recursiva de sí mismo. Mano, escritura y niebla pertenecen al mismo modelo, no a decoraciones distintas que se parecen.

Arrastrar o maximizar cambia presentación/vista. El negativo retenido mantiene sus dimensiones y contenido originales; su marco vive en coordenadas de esa captura. Abrirlo después en otra resolución no cambia palabras, sujeto o carta entregada. Arrange windows ordena ventanas, no reinicia la historia.

El año1987 es el registro de Mara; guest pertenece a la sesión actual del escritorio. Si muestras un reloj atrapado en un minuto, identifícalo como tiempo grabado. No obligues a esperar60segundos ni confundas ese recurso con el reloj actual del sistema ficticio.

Usa las mismas fases en archivo del trabajo, notificación y captions: Repeating -> Call stopped / letter pending -> Capture retained -> Letter draft ready -> Valid delivery / ready to finish -> Session finished. No llames Complete o Recovered a todos los hitos.

Un envío fallido tiene feedback de POSTMAN y no vuelve a armar la llamada de TERMINAL. La campana conserva su única causa. El final lo protagoniza una acción Finish session sobre la entrega real: el modelo se confirma inmediatamente y después presenta la liberación del cristal, sin depender de que una animación termine.

### 14.6. Recuperación que no castiga los aciertos

Conserva el trabajo ya válido al corregir una fuente, reencuadrar o cambiar de ruta. Undo pertenece a la edición activa; dentro de un campo de texto conserva su comportamiento normal. Una edición de imagen, un movimiento de ventana y una entrega confirmada no son el mismo tipo de acción.

Si el almacenamiento realmente falla, el caso puede seguir en memoria con un indicador Session only. No prometas Saved locally si no se guardó. No conviertas esto en otra advertencia para todos los jugadores ni expongas detalles técnicos en el camino normal.

El final muestra la carta y la fotografía efectivamente elegidas, no una tarjeta preescrita idéntica para todos. Su reconocimiento puede ser cálido e inquietante sin inventar psicología del jugador, una muerte de Mara ni una sorpresa obligatoria que castigue a quien entendió temprano la nota.

### 14.7. Pruebas entre apps, no solo de cada componente

Además de lo anterior, demuestra los escenarios del documento25:

- Entregar A -> editar borrador B -> inspeccionar inbox/acuse: A permanece intacta y nunca se certifica B sin enviarla.
- Crear carta desde captura -> descartar su miniatura -> reabrir carta: no pierde su imagen/escritura.
- Cambiar resolución/maximizar tras capturar -> reabrir negativo/carta: mismos datos y fase, presentación segura.
- Reply -> todavía borrador; Send a remitente -> retorno local sin rearmar el bucle; corregir destinatario -> entrega válida conservando el contenido.
- Envío incompleto -> feedback real sobre lo que falta; corregir no exige repetir la llamada resuelta.
- Delivered -> Return to the request -> Finish session: cierre real una vez, con la misma carta/acuse.
- Terminar -> editar una copia o recargar: caso estable; Replay explícito -> otro run que no acepta el acuse anterior.
- Ruta de teclado y de puntero con las mismas capacidades y resultados, sin un botón que conceda un éxito ficticio.

En design-review.md explica qué ambigüedades resolviste y qué cambiaste si encontraste una alternativa mejor. No presentes estos escenarios de papel como pruebas ya ejecutadas. Esta ampliación mejora la coherencia del mismo encargo; no pospone el escritorio convincente, los defectos reproducidos o el final completo.

### 14.8. Una continuidad que se ve y un final que devuelve tu trabajo

Haz reconocible el mismo contenido en los traspasos: miniatura real de ECHO al abrir CANVAS, carta real al componer en POSTMAN y ese mismo contenido en Guest Inbox/acuse. No sustituyas la imagen del jugador por un adjunto genérico o una postal prefabricada. La identidad se expresa con el objeto y su vista, no con IDs técnicos en el flujo principal.

Cada traspaso contextual abre el siguiente programa con el objeto correcto seleccionado y su control relevante visible. No pierde el trabajo anterior ni cierra o recoloca todas las ventanas para forzar una presentación. Usa una entrada coherente por ventana/objeto, sin encadenar animaciones que retrasan la acción; con movimiento reducido el mismo contenido aparece directamente.

El arco puede plantear una pregunta comprensible por fase —qué vuelve, dónde quedó la impresión, qué dice la escritura, quién viene después, si la sesión puede terminar— mediante evidencia y ayuda opcional. No crees cinco popups obligatorios ni censures una deducción temprana.

El cierre debe mostrar tu carta efectivamente entregada y después liberar a la misma presencia. El recorte, la región despejada y la composición que elegiste permanecen en el resultado real. El reconocimiento de guest recompensa la historia; la carta propia recompensa lo que hiciste, incluso si ya habías entendido el destinatario. Evita una felicitación genérica, un análisis inventado de tu personalidad o un último susto que reabre el trabajo terminado.
