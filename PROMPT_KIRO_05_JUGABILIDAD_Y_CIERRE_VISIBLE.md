# Encargo 05 — reparar v4 y mejorar las decisiones sin perder su diseño

Preparado por Codex el 8 de noviembre de 2026 para que el participante lo ejecute manualmente en Kiro IDE. Este archivo no es una ejecución ni una afirmación de uso de un modelo o créditos. La entrega anterior de prompt04 sí existe y debe conservarse.

## 1. Lee la versión real y juzga también a Codex

Trabaja en `C:\Users\51924\Documents\Kiroween2026\PleaseHauntYourself`.

Lee, en este orden:

1. `AGENTS.md` y `.kiro/steering/project-contract.md`, distinguiendo sus estados históricos de la entrega actual v4.
2. `docs/development/26_V4_Independent_Review_And_Experience_Priorities.md` COMPLETO: contiene evidencia, reproducciones, límites y propuestas para cuestionar.
3. `.kiro/specs/os-case-v4/requirements.md`, `design.md`, `design-review.md`, `tasks.md` y `first-visit-protocol.md`.
4. `docs/development/23_The_Unsent_Letter_Narrative_Contract.md` y `25_Consistency_Across_The_Four_Programs.md`.
5. `PROMPT_KIRO_04_SO_REAL_Y_CASO_COMPLETO.md` completo, incluida la sección14, y la revisión24 para entender lo conservado y lo ya reparado. No repitas prompt04 como si sus aplicaciones siguieran sin implementar.
6. El código y los checks afectados; `README.md`, `PITCH.md` y el registro real de Kiro para el contexto de entrega.

El participante considera que el diseño ya está muy bien. Mantén la identidad actual del SO y de sus cuatro apps. No hagas otro cambio completo de estilo. Tu encargo es implementar reparaciones y una mejora perceptible de experiencia en esta base.

Sé crítico con la revisión26: reproduce sus hechos, distingue defectos de opiniones y compara soluciones. No tienes que dar la razón a Codex. En una nueva especificación de esta iteración, escribe `design-review.md` con posiciones **aceptar / modificar / rechazar**, razón y evidencia. Si descartas una propuesta de interacción, ofrece y ejecuta una alternativa más clara. No inventes consenso, usuarios o resultados.

## 2. Reproduce y corrige primero los fallos de integridad y recuperación

### A. El límite de correo no puede borrar el final

Reproducción: completa el caso y acepta la carta A en TERMINAL. Desde CANVAS vuelve a componer; envía a Mara 13 intentos devueltos, cambiando el mensaje entre envíos. `MailModel.send()` elimina las entregas más antiguas al superar12. Se pierde A, pero el acuse la sigue referenciando. Reload rechaza ese guardado válido y reinicia todo el caso.

Protege los objetos esenciales para la entrega prevista y el acuse final al limitar el historial. Conserva los límites, la independencia de las instantáneas y la validación estricta del guardado; no aceptes referencias rotas como solución. Revisa también la ruta antes de Finish y el significado de Send/Replace después del final. Una nueva copia no revoca la carta aceptada.

### B. CANVAS ofrece Undo después de haber perdido su historial

Reproducción: usa una captura válida; con la escritura aún en la niebla, enfoca Mist y pulsa Home. Reload → abre CANVAS. Dice "Undo brings it back", pero Undo y Lift están deshabilitados.

Existe Reset to the capture en el menú, por lo que no es un bloqueo permanente. Haz que la recuperación real esté visible y conserve los cambios no relacionados. Una posible solución es restaurar la escritura desde la captura retenida cuando ya no hay Undo. Puedes mejorarla; no inventes palabras para una fuente que no las contenga.

Añade regresiones de estas rutas: son fallos reales que los113 tests y50 recorridos existentes no cubrían. No modifiques las expectativas antiguas para ocultarlos.

## 3. Un SO redimensionable debe seguir siendo utilizable

Corrige TERMINAL a480×420: se cortan Back to the prompt y las acciones de la campana. Corrige ECHO a640×480: se corta el estado de la captura y Discard puede sobresalir tras un traspaso. Evalúa diseño interno adaptable, scroll real y mínimos justificados; conserva la prioridad de PC.

Inspecciona tamaños por defecto, máximos, mínimos y posiciones no previstas en1366×768,1440×900 y1920×1080. Las66 capturas del recorrido normal sin errores no prueban las ventanas pequeñas. Comprueba las distintas páginas del inspector y las confirmaciones, no solo la portada de cada app.

Revisa las imágenes y texto reales: proporciones, encuadre intencional frente a recorte accidental, palabras y renglones completos, títulos, controles, contraste y tamaño de lectura. No ocultes texto, botones o resultados para que pase una auditoría. Un panel desplazable debe permitir llegar a su contenido con puntero y teclado.

## 4. Conserva orientación y recupera descubrimiento

En la primera pantalla, la franja del trabajo ya dice "Next: Stop the call". Esto entrega la solución antes de observar la campana, pese al buen cambio de dar igual peso a Stop y Muffle.

Separa:

- Objetivo claro por defecto: qué sigue pendiente.
- Evidencia visible: qué ocurrió por tu acción y por qué vuelve.
- Ayuda opcional gradual: una pista, luego una respuesta exacta bajo petición.

No fuerces un intento fallido ni un tutorial para habilitar un acierto temprano. Las opciones deben seguir teniendo nombres comprensibles. No conviertas toda la interfaz en metáforas oscuras.

Evalúa el mismo problema en POSTMAN: "guest, you at this desk now" explica de inmediato el reconocimiento final. Contrasta cómo conservar la identidad guest del SO, la nota de Mara, las direcciones reconocibles y la ayuda explícita dejando que la persona relacione las evidencias. No cambies el destinatario, no escondas una dirección obligatoria y no añadas un acertijo arbitrario. Puedes mantener el texto actual si justificas que una alternativa empeora la comprensión; en ese caso refuerza otro momento real del descubrimiento.

## 5. Haz que CANVAS sea una edición que se sienta propia

La ruta correcta actual es Lift the writing → Compose. Hay buenas operaciones opcionales, pero poca necesidad de decidir. Una ruta accesible y rápida es valiosa; más clics o arrastrar al único lugar permitido no constituyen una mejora.

Compara al menos dos alternativas pequeñas antes de elegir. Codex propone explorar la selección y separación visible de la escritura real y la revelación de la foto: previsualizar qué material se conserva y qué cambia en la imagen; colocarlo en el papel mediante una operación propia de un editor. Mejora o rechaza esta propuesta si solo añade gestos a la misma instrucción.

La opción elegida debe producir una consecuencia perceptible en el artefacto final, permitir una decisión explicable y ser coherente con niebla, escritura y presencia. Mantén una alternativa de teclado con las mismas elecciones y resultado. No impongas precisión motora, un segundo minijuego de limpiar, palabras inventadas, acertijos de porcentajes o una composición única obligatoria.

Implementa la mejor alternativa acotada. Explica honestamente qué decisión nueva o mejor expresada aporta y qué sigue siendo una acción directa. No cuentes aplicaciones, animaciones ni pasos administrativos como nuevos acertijos.

## 6. El final debe poder verse y devolver la carta que hiciste

En el recorrido estándar de1366×768, la mano está cerca de(669.6,306.2) y TERMINAL la tapa justo antes de Finish. La liberación dura1400ms detrás de las ventanas. El estado final funciona; el momento importante puede pasar oculto.

Compara cómo hacer visible la misma presencia y la carta real sin desplazar, cerrar ni minimizar ventanas automáticamente. Una opción es ofrecer desde el acuse una vista del mismo cristal vivo; otra, un vistazo explícito y reversible del escritorio real. Propón algo mejor si lo hay. No conviertas contemplar una animación en otra condición secreta de victoria.

Respeta el mundo compartido y sus coordenadas: no dupliques un fantasma decorativo para fingir que se ve, no muevas la mano a un lugar conveniente y no hagas una captura recursiva de la UI. Si muestras una proyección, debe leer el mismo modelo y corresponder a la presencia real.

Finish confirma una sola vez el acuse real e inmediatamente actualiza el modelo; la animación presenta ese resultado. Reload, interrupción y movimiento reducido mantienen el final. El jugador debe poder leer/contemplar su carta, reconocer su propio encuadre y volver a los programas normales sin otro encargo ni susto que reabra la historia.

## 7. Revisa un único recorrido completo, con criterio de juego

Conserva TERMINAL → ECHO → CANVAS → POSTMAN → TERMINAL. La captura y la carta que se ven en cada traspaso deben ser las mismas. No añadas programas ni una nueva campaña para cubrir estos problemas.

Antes de dar por terminada una interacción, responde en `design-review.md`:

1. ¿Qué intenta conseguir una persona que no programa?
2. ¿Qué puede observar y decidir, sin conocer nuestros documentos?
3. ¿Qué cambia por su acción y cómo lo reconoce?
4. ¿Puede corregirse sin perder lo que ya hizo bien?
5. ¿Por qué este momento pertenece a esta aplicación y a Halloween?
6. ¿Qué objeción fuerte le harías tú mismo a la solución elegida?

Evita llenar cada paso con texto explicativo o popups. Prioriza cambios que se puedan demostrar dentro de las apps. Mantén ayudas opcionales y una ruta rápida. Los objetivos previos de tiempo siguen siendo objetivos no medidos, no resultados. No alargues la ruta obligatoria sin justificarlo frente a la demo y a la experiencia.

## 8. Verifica, critica y entrega evidencia real

- Especifica requisitos, diseño y tareas de esta iteración antes de implementarlos, preservando las especificaciones históricas.
- Ejecuta build, tests pertinentes y las regresiones existentes afectadas. Añade las pruebas de integridad, recuperación y límites que realmente falten.
- Recorre el caso con acciones reales, también errores y recuperación. Comprueba una ruta natural de Tab/Shift+Tab: enfocar elementos por código en un test no prueba que una persona llegue a ellos naturalmente.
- Toma e inspecciona capturas reales en los tres tamaños PC y en los mínimos permitidos. Incluye los fallos antes y su solución después, las imágenes, palabras largas, confirmaciones y el final.
- Revisa pausas/interrupción, movimiento reducido, A enviada/B editada y fuentes descartadas con carta conservada. Comprueba el mismo objeto real en todos los traspasos.
- Haz una segunda crítica de tu propia versión después de verla. Corrige defectos observados; no declares diversión o comprensión humana sin personas. El protocolo de primera visita sigue disponible para una prueba real posterior.
- Actualiza README, las instrucciones vigentes y kiro-usage con lo que realmente hiciste. Registra el modelo solo según lo observable; no atribuyas esfuerzo o créditos desconocidos. Actualiza PITCH solo si cambia lo demostrable, sin inventar grabaciones ni tiempos humanos.
- Respeta las bases verificadas de la hackathon y las licencias de recursos. Si necesitas afirmar un requisito oficial nuevo o mutable, verifica su fuente oficial y distínguelo de una preferencia de diseño. No inventes ventajas competitivas ni garantías de premio.

En tu respuesta final entrega: qué implementaste; qué aceptaste/modificaste/rechazaste y por qué; capturas comparables y rutas de evidencia; resultados de pruebas; limitaciones pendientes; y cómo abrir la compilación nueva localmente sin confundirla con caché o con el prototipo antiguo.

Este es un encargo de implementación, no solo otro plan. Trabaja de forma autónoma dentro de este alcance. Conserva la identidad visual lograda y el código histórico. No instales dependencias sin una necesidad concreta, automatices el escritorio nativo, cambies cuentas, compres, publiques, hagas push o envíes a Devpost. No inventes un uso de herramientas o una investigación que no realizaste.
