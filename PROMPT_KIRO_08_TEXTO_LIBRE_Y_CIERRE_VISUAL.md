# Encargo 08 — contener el texto libre de POSTMAN sin perder contenido

Preparado por Codex el 9 de noviembre de 2026 para ejecución manual del participante en Kiro IDE. Este archivo prepara una reparación local; no afirma que ya esté implementada.

## 1. Contexto y criterio

Trabaja en `C:\Users\51924\Documents\Kiroween2026\PleaseHauntYourself`.

Lee `AGENTS.md`, `.kiro/steering/project-contract.md`, `docs/development/29_V7_Deep_QA_And_Long_Text_Layout.md` y las specs `.kiro/specs/confirmation-flow-v7/`. Conserva los contratos narrativos y de datos de las iteraciones anteriores.

V7 arregla el bucle de confirmaciones y sus rutas de recuperación. El diseño y el caso completo se conservan. Codex también completó en Edge una ruta que reemplaza con una carta incompleta, corrige, termina, recarga, envía una copia sin adjunto y empieza otra partida. El fallo nuevo es de presentación de texto libre permitido, no una razón para rehacer el juego.

Reproduce los hechos y cuestiona las soluciones de Codex. Documenta qué aceptas/modificas/rechazas con razones y evidencia. Implementa una solución acotada y comprueba el resultado real, no solamente otro plan.

## 2. Reproducción

Con una carta válida preparada en CANVAS:

1. Compose in POSTMAN.
2. En Subject, introduce 120 letras `W` seguidas, sin espacios (máximo permitido).
3. En Message, introduce `abcdef` repetido 100 veces: 600 caracteres sin espacios (máximo permitido).
4. Envía a guest y abre la entrega. Mira la lista, el asunto, el mensaje, el acuse y la imagen.
5. Reduce POSTMAN a 640×460 y vuelve a inspeccionar.

La lista se desborda y parte de su contenido sale incluso por la izquierda. El panel lector de 242 px llega a un ancho desplazable de 4209 px; sus hijos ocupan unos 4177 px y la carta queda cortada. Es contenido aceptado por la interfaz, no una inyección ni un texto que supera sus límites.

La entrega sigue íntegra y Codex pudo volver a TERMINAL y finalizar. No lo presentes como pérdida de datos ni bloqueo de toda la partida. Con el contenido normal del caso no se reprodujo este defecto.

Puntos de entrada: `src/haunt/desktop.css`, `.message-item`, `.item-subject`, `.reading-pane`, `.mail-head`, `.mail-body`, `.mail-message`, sus tracks y mínimos; `postman-view.ts` para la relación entre campos, lista y vista de entrega. No cambies innecesariamente el modelo de correo.

## 3. Resultado esperado

- El texto admitido no ensancha las columnas ni la carta fuera del panel. Asunto, remitente, fecha, estado y acciones permanecen legibles y alcanzables.
- El cuerpo completo se conserva y puede leerse mediante saltos de línea y scroll vertical normal. No ocultes texto real del mensaje para que pase una auditoría.
- La imagen conserva su aspecto y escala a su espacio, sin heredar el ancho intrínseco de una palabra larga ni cambiar la fotografía del jugador.
- No reduzcas los límites 120/600 como sustituto de arreglar la maquetación; no trunques ni alteres silenciosamente el contenido almacenado.
- La lista puede usar un resumen intencional si lo justificas, pero el contenido completo debe estar disponible y accesible. Prefiere una solución que no necesite excepciones nuevas en el auditor. No relajes sus reglas de forma general.
- Revisa los mínimos automáticos de grid/flex y los hijos, además de `overflow-wrap`; una palabra partida no arregla por sí sola cualquier track o centrado intrínseco.
- Mantén el estilo, las confirmaciones con identidad de intento, las instantáneas inmutables y la ruta de teclado de v7.

## 4. QA dirigida a los límites reales

Compara antes/después con controles reales y datos reales de la entrega:

- Asunto largo solo; cuerpo largo solo; ambos juntos.
- Texto largo con espacios y saltos de línea, y una muestra corta de caracteres Unicode admitidos.
- Límites120/600 y contenido normal de Mara. Verifica que lo enviado conserva exactamente el texto.
- Lectura en Guest Inbox y Sent; copia y reapertura/recarga. La ruta Returned usa las mismas piezas de vista: revísala también.
- Tres tamaños PC 1366×768, 1440×900 y 1920×1080, POSTMAN normal/mínimo/máximo. Revisa dimensiones y contenido visible, no solo ausencia de errores de consola.
- Llegar por puntero y teclado a Return to the request, Fix it in CANVAS cuando corresponda y al contenido desplazable. El caso sigue terminando y reload conserva el final.
- Auditor DOM y de texto dibujado sobre las nuevas rutas, más capturas inspeccionadas. No escribas pruebas que se limiten a repetir una declaración CSS.

Ejecuta build, pruebas y checks afectados; preserva los demás. Aprovecha los navegadores ya instalados si sirve para contrastar, sin instalar software ni usar perfiles personales. Un recorrido en Edge no equivale a validar todos los navegadores.

## 5. Cierre de esta iteración

Prepara requisitos/diseño/tareas conservando los históricos. Revisa tu propia solución tras verla y corrige defectos observados. Actualiza README, instrucciones vigentes y kiro-usage con lo realmente hecho; modelo/esfuerzo/créditos solo si son observables.

Entrega: posición crítica sobre las propuestas, cambios implementados, capturas comparables, resultados exactos, límites pendientes y cómo abrir la nueva compilación en `/haunt.html`.

No añadas programas, otra historia, pasos obligatorios ni un rediseño para resolver este caso. La primera visita con una persona sigue pendiente; no conviertas pruebas o una IA en evidencia humana de diversión. Una futura simulación a ciegas tendría que declararse como tal y realizarse como tarea separada.

Conserva el prototipo histórico, licencias y las bases verificadas. No automatices el escritorio nativo, cambies cuentas, compres, instales dependencias sin necesidad concreta, publiques, hagas push ni envíes a Devpost.
