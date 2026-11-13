# Kiro IDE / Opus — prioridad PC, ventanas movibles y una mejora jugable sustancial

Este encargo fue preparado por Codex para que el participante lo ejecute en Kiro IDE, dentro de `PleaseHauntYourself`. No es una afirmación de que esta tercera tarea ya se ejecutó. Usa el modelo realmente seleccionado en el IDE; no atribuyas un esfuerzo o consumo de créditos que no puedas observar.

**Nueva iteración del encargo:** además de PC, arrastre y mecánicas distintas, el usuario quiere una progresión visual del escritorio y escenas de Halloween con presencia. Propone vaho y una sombra/mano sobre el cristal. Codex desarrolla esa idea en la sección 4E y el documento21, con descubrimiento espacial, respuesta al gesto y un resultado propio de la partida. Debes cuestionarla, mejorarla e implementar una escena global causal dentro del caso TERMINAL/ECHO; no convertirla en otra capa decorativa ni sustituir el trabajo jugable por una cinemática.

**Corrección de duración y cierre global:** lee la sección 4F, el documento22 y PITCH.md. La recomendación de producto final es un solo caso corto que usa cuatro programas y vuelve a TERMINAL para resolver el problema inicial. El incremento de dos apps es un checkpoint de desarrollo, no el final de ese producto. Objetivos editoriales, aún sin medir: primera partida de unos 6–9 minutos, ruta conocida mostrable en unos 110 segundos y video de aproximadamente 2:50, con margen hasta 2:55. No son límites oficiales del juego ni autorización para añadir relleno o implementar de golpe las cuatro apps.

## 1. Entiende la corrección del usuario

El usuario ha probado la versión 2 y sigue percibiendo el mismo juego. Quiere **PC como plataforma principal**, poder mantener pulsada la barra superior y mover las ventanas con el cursor, y una experiencia más creativa e interactiva tanto en TERMINAL como en ECHO. El móvil es secundario. No pidió una aplicación de teléfono.

La entrega anterior sí arregló errores y mejoró la presentación. Pero su encargo mantenía las decisiones del mismo puzzle y dejaba el arrastre opcional. Ese límite se elimina aquí. **Puedes cambiar la mecánica, el modelo y el recorrido**, no solo sus controles. ECHO ya no está excluido: trabaja sobre las DOS aplicaciones existentes. Diseña un único caso final con cuatro contribuciones nativas distintas y necesarias; CANVAS y POSTMAN son candidatos, no elecciones incuestionables. En este encargo implementa primero el checkpoint completo de TERMINAL/ECHO y deja los dos siguientes y el cierre global especificados, sin fingir que ya funcionan.

Tómate el tiempo necesario para diseñar, implementar, probar y corregir. No termines porque los tests viejos se pongan verdes o porque hayas cambiado la apariencia. La entrega debe cambiar de forma demostrable lo que el jugador hace y las consecuencias de sus decisiones.

Lee primero:

- AGENTS.md, especialmente la instrucción más reciente.
- docs/development/19_PC_Gameplay_Reset.md: hechos comprobados, límites del encargo anterior y nueva dirección.
- docs/development/20_Causal_Desktop_Codex_Opinion.md: opinión concreta de Codex, relación propuesta entre TERMINAL/ECHO/campana, escritura fantasmal contextual y objeciones para los cuatro programas. Léelo críticamente; no lo trates como aprobación de una mecánica ya resuelta.
- docs/development/21_The_Glass_And_The_Desktop_Arc.md: siguiente iteración creativa, escena del cristal, ideas adicionales de Codex, progresión global, coreografía y condiciones para que lo vistoso sea jugable y comprensible.
- docs/development/22_One_Case_Four_Programs_And_A_Three_Minute_Demo.md y PITCH.md: tiempo oficial del video, referencias verificadas con sus límites, grafo de cuatro programas, checkpoint frente a cierre global y presupuesto de demostración. El documento22 prevalece sobre las formulaciones anteriores que trataban las dos apps como el final del producto.
- .kiro/specs/terminal-experience-v2/ y el código ACTUAL, no solo los documentos de intención.
- El modelo/view de TERMINAL, `echo-view.ts`, `echo-scene.ts`, `desktop.ts`, `window-motion.ts`, estilos, persistencia y pruebas relevantes.

Conserva el trabajo del usuario y el historial. Puede haber cambios sin commit de la entrega 2. No hagas reset/clean ni regreses a una versión anterior. Mantén el antiguo paper-bridge como prototipo histórico; no es el juego a mejorar.

## 2. Plataforma y objetivo

El entregable principal es un **SO ficticio de Halloween jugable en navegador de PC**, con ventanas que se comportan como ventanas y programas con conflictos propios. El público incluye personas que no programan. La promesa sigue siendo entrar en un programa poseído, entender una anomalía a través de acciones, intervenir y recuperar una función real del programa.

La norma de plataforma de https://kiroween.devpost.com/rules no exige móvil: pide funcionar en la plataforma declarada. Costume Contest requiere que lo terrorífico mejore la función de la interfaz. Si puedes consultar las páginas oficiales, contrasta las afirmaciones; si no, declara la limitación. No inventes restricciones, puntuaciones, premios garantizados, estudios de usuarios o aprendizaje demostrado. Impacto puede explicarse con un propósito de entretenimiento interactivo accesible, pero debe sostenerse con lo que realmente funciona.

Producto, código y documentos de entrega en inglés. Este prompt interno está en español para que el participante pueda revisarlo.

## 3. Obligatorio: mover las ventanas en PC

Implementa arrastre REAL de las ventanas de TERMINAL y ECHO desde el área vacía de su barra superior:

- Mantener botón principal, mover y soltar cambia la posición de la ventana. Usa captura de puntero y limpia cancelación/pérdida de captura/cierre. No confundas esto con mover un objeto dentro del juego ni con las pestañas del navegador real.
- Minimizar/cerrar/botones, inputs, enlaces y selección de contenido no deben iniciar un arrastre. Lleva al frente/focaliza la ventana adecuada sin perder el foco del texto innecesariamente.
- Conserva animaciones de apertura/cierre, interrupciones, preferencias de movimiento y estados del juego. El arrastre debe responder directamente, sin retraso ni animación que persiga al cursor.
- Mantén las ventanas recuperables dentro del espacio de trabajo. Comprueba cambios de tamaño del navegador y cambios de tamaño de la aplicación al entrar/salir de la escena. No uses el mismo transform para posicionar y animar de maneras que se sobrescriban.
- Incluye una alternativa de teclado y una forma visible de restaurar/ordenar posiciones. Poder ordenar dos ventanas para comparar información debe ser fácil. La superposición se resuelve con movimiento, foco y composición, no abandonando el escritorio.
- Verifica posiciones con geometría real y pointerdown/move/up en el navegador. No basta con `cursor: grab` ni una clase `draggable`.

La composición PC debe cuidarse en 1366×768, 1440×900 y 1920×1080: escenas legibles y con tamaño intencional, texto principal cómodo, acciones accesibles, foco claro, ventanas sin invadir la barra del sistema o el dock, y sin huecos grandes accidentales. No aceptes 11px como objetivo para todo el texto. Mantén compatibilidad razonable con pantallas pequeñas sin volver a convertir el móvil en la prioridad del diseño.

## 4. Obligatorio: cambiar la interacción central

Antes de diseñar, describe honestamente en una tabla qué decisiones reales tiene hoy el jugador. No cuentes abrir un panel, pulsar Watch o ver otra animación como si fueran nuevos acertijos. Actualmente el núcleo sigue siendo cambiar nota/voz/campana y dar una despedida. Reorganizar eso de nuevo no satisface este encargo.

Explora 3 propuestas de MECÁNICA, no 3 distribuciones de botones. Para cada una explica:

1. Qué anomalía observa el jugador y qué puede hacer sin saber programar.
2. Qué descubre gracias a su acción, no porque la narración le da la solución.
3. Qué produce, transforma o decide realmente el jugador.
4. Dos intervenciones plausibles que llevan a consecuencias distintas y por qué.
5. Cómo cambia una función nativa de la aplicación después.
6. Qué hace ECHO que TERMINAL no puede hacer, y viceversa.
7. Por qué pertenece a un escritorio de Halloween y no a un puzzle genérico pegado detrás de un marco.

Rechaza propuestas cuyo recorrido eficaz siga siendo el mismo con más texto. Elige una y constrúyela. Puedes mantener partes de la mecánica anterior como introducción o material reutilizable; no tienes que conservarla como solución final. Evita añadir tareas arbitrarias para alargar la partida.

### Propuesta concreta que debes cuestionar, mejorar o superar

**La aparición que no debe seguir siendo una señal viva.** TERMINAL insiste en que una copia ya terminó, pero ECHO todavía muestra una presencia. El jugador usa el monitor de ECHO para distinguir una señal que se repite de una imagen que solo guarda un recuerdo. Puede congelar/capturar un momento nacido del estado real de la partida y decidir qué conserva y qué deja de ejecutar. Una captura inofensiva puede guardar la aparición sin mantener su prisión.

La interpretación debe ser jugable: no basta un botón Capture que siempre da el objeto correcto y resuelve todo. El jugador compara evidencia, prueba una intervención y ve su consecuencia en la otra aplicación. Confundir una señal activa con una memoria congelada debe dar un resultado visible y recuperable. Lo que se conserva nace de sus acciones, no de un trofeo genérico preexistente.

Las ventanas movibles permiten comparar y organizar evidencia, sin obligar a acciones simultáneas o a velocidad. ECHO debe intervenir mediante sus propios controles de imagen/fuente/captura, y recuperarse como aplicación; TERMINAL mediante su ejecución/entrada/salida, y recuperar su prompt. No presentes una cámara real ni solicites acceso a ella si la fuente es una escena simulada: decláralo dentro de la ficción cuando importe.

Puedes reemplazar esta propuesta por otra mejor si demuestras un recorrido y consecuencias más sólidos. Pero ECHO no puede continuar como el teatro aislado de “Example entrance / Rehearse entrance” que no modifica el caso principal. Reutiliza el arte y los componentes que sirvan; cambia el valor funcional del programa. No conviertas el arrastre de ventanas en otro juego de caminar de un extremo a otro, concepto que el usuario ya rechazó.

### 4A. La relación TERMINAL / ECHO / campana debe tener una causa

El usuario pregunta con razón qué une estos elementos. No basta con que una aplicación contenga un fantasma y la otra tenga estética de estudio. Define, con palabras sencillas y luego como estados/eventos, quién origina la llamada, por qué la campana devuelve al fantasma, qué puede observar/cambiar cada programa y qué prueba que la intervención funcionó.

Codex propone para cuestionar: un trabajo sin terminar en TERMINAL conserva una referencia activa de ECHO; las actualizaciones vuelven a llamar a la sesión. La campana representa ese retorno. Una imagen guardada conserva contenido sin suscribirse a más actualizaciones. Pausar la vista no detiene el origen, capturar no sustituye automáticamente la referencia y silenciar no cierra el trabajo. El jugador debe comprobar la diferencia y decidir qué referencia conservar. No adoptes esta regla si no puedes hacerla clara y consistente; reemplázala por una mejor.

No añadas una fotografía que mágicamente mata un proceso. Explica la operación nativa que conecta el artefacto con la petición. Tampoco aceptes Capture -> Finish como un puzzle suficiente si no hay interpretación, experimentación o consecuencia propia. El documento20 contiene un recorrido concreto, sus objeciones y criterios para revisarlo.

### 4B. El fantasma debe habitar el programa

Integra escritura fantasmal en el propio historial de TERMINAL. `HELP ME.` puede ser una primera irrupción; después las líneas deben responder a acciones reales. Ejemplo que puedes mejorar: pausar la vista de ECHO sin detener la llamada produce `You stopped the picture. Not the call.` Aceptar una imagen, retener una señal activa, forzar una interrupción y terminar correctamente deben tener respuestas distintas, coherentes con el estado.

Estas líneas deben aportar evidencia o personalidad, no ruido. Nunca escribas sobre el input del jugador ni simules control de su terminal real. No robes el foco ni fuerces scroll si está leyendo. Usa un historial acotado y señales revisables. Texto completo con movimiento reducido, sonido opcional, eventos sin duplicarse al reabrir/minimizar. No introduzcas generación de texto por IA en tiempo de juego; un conjunto breve de líneas condicionadas puede ser mucho más preciso.

### 4C. Prepara cuatro programas sin repetir el mismo encuentro

El diseño global debe cubrir al menos TERMINAL, ECHO y dos más. Para cada programa define: función reconocible, personalidad/manifestación de Halloween, gesto nativo distintivo, deducción propia, intento equivocado comprensible, recuperación, artefacto/capacidad útil y relación causal con otro programa. No hagas cuatro habitaciones con tres interruptores y diferentes colores.

Codex propone CANVAS con una goma que revela marcas borradas y composición por capas; su debilidad pendiente es justificar por qué esa manipulación cambia el conflicto. Propone POSTMAN con un hilo que devuelve sus propias respuestas y una obligación de reintento que debes resolver mediante evidencia de ruta/destinatario; su debilidad pendiente es evitar adivinar direcciones o reducirlo a pulsar Send. Mejora o sustituye esas propuestas, explicando el cambio. Usa los artefactos reales de la partida cuando haya una razón, no una cadena arbitraria de llaves.

En esta tarea entrega un checkpoint coherente de las dos apps existentes: una recuperación parcial comprobable, su escena global y artefactos reales. El producto recomendado debe resolver el caso mediante las cuatro contribuciones y el retorno final a TERMINAL. Deja las dos siguientes apps y ese cierre global con requisitos, estados, acciones y criterios de aceptación listos para desarrollar después. No declares el caso total terminado con solo las dos primeras ni finjas que POSTMAN ya participa en el build actual. Diseñar cuatro escenas no autoriza a reportarlas como cuatro experiencias implementadas.

### 4D. Debate real con la opinión de Codex

Escribe `.kiro/specs/pc-agency-v3/design-review.md` con las propuestas de Codex que aceptas, modificas o rechazas, las razones y el recorrido mejorado que eliges. Compara al menos tres mecánicas, no tres layouts. Señala tus propios puntos débiles y las contradicciones que resuelves. Resume decisiones de diseño; no publiques razonamiento privado.

No te limites a complacer a Codex o al usuario. Si una idea es solo un efecto vistoso, dilo y sustitúyela. Después implementa la mejor solución defendible. Tu respuesta será la siguiente parte del intercambio: Codex revisará el resultado real cuando el usuario lo devuelva. No inventes una conversación entre agentes ni afirmes consenso/validación de Codex antes de que ocurra.

### 4E. El escritorio necesita una progresión y un gran momento propio

La experiencia debe cambiar visiblemente con el avance. No basta con que todas las escenas ocurran en la misma habitación o que cada tarea termine en un toast. El usuario propone una pantalla como un cristal de noche que se empaña y recibe la sombra o presión de una mano. Incorpora esa ambición cinematográfica sin perder la interacción.

**Propuesta desarrollada por Codex: la presencia alcanza el cristal.** La misma aparición empieza dentro de TERMINAL. Cuando el jugador rompe de verdad la llamada que la devuelve, el programa confirma el avance. El vaho se extiende por el cristal del escritorio ficticio, una silueta pasa y aparece una mano. Si mueves la ventana, la huella permanece en la superficie del escritorio. Eso permite descubrir que la presencia ya no está dentro de ese programa. No retrases el arrastre real para crear el efecto.

El jugador puede limpiar una región del vaho y la presencia responde allí. La forma limpiada puede conservarse en una imagen real de esta partida. ECHO debe distinguir una captura de la ventana y una de la superficie pertinente; una captura de una ventana vacía no puede incluir mágicamente una mano exterior. TERMINAL confirma qué dejó de ejecutarse y qué obligación queda, sin negar la reparación conseguida. Define la fuente y los datos compartidos antes de implementar. La captura tiene que nacer del mismo modelo que produce lo que el jugador ve, sin cámara ni acceso a su pantalla real.

Cuestiona la propuesta: ¿el cambio de superficie produce una observación comprensible?, ¿hay un motivo para mover la ventana?, ¿seleccionar la fuente es una decisión o un menú con respuesta obvia?, ¿la huella y el gesto cambian algo que el jugador pueda reconocer al final? Si solo queda Capture -> Finish, mejora la mecánica o propón otra escena con un descubrimiento y un resultado más sólidos. No cuentes una revelación narrativa como nuevo acertijo sin consecuencias propias.

Otras dos aportaciones de Codex que debes desarrollar críticamente:

- **Cada app atestigua el avance a su manera:** TERMINAL añade una línea precisa, ECHO conserva la evidencia visual, el futuro CANVAS manipula marcas como capas y el futuro POSTMAN produce una recepción/ruta real dentro de la ficción. Nada de cuatro programas mostrando el mismo popup o cuatro versiones del mismo puzzle.
- **El resultado contiene lo que hizo este jugador:** el checkpoint actual conserva una captura con su región despejada/estado elegido y la recuperación parcial real. El cierre del caso integrado añade las marcas y el recibo reales que completan la petición original. No exhibas objetos que no creó ni deshagas el éxito con otro susto que reinicia lo mismo.

Diseña una progresión de presencia dentro de una app -> cambio causado en el escritorio -> intervención/comprobación -> liberación y uso normal. Implementa un momento global completo en el caso actual y planifica su evolución con los dos programas futuros. Evita que cada pequeño paso dispare una interrupción de toda la pantalla. La superficie global no es una app nueva ni obliga a construir ya CANVAS/POSTMAN.

El documento21 propone una secuencia visual de aproximadamente dos segundos para el primer cambio, con controles utilizables desde el inicio, una huella inspeccionable y entrada directa durante el gesto. Refina esa coreografía desde un video real. Nunca desenfoques todo el texto y los controles para simular niebla. El cambio cubre visualmente el viewport del juego, no las ventanas reales del SO. Ofrece omitir/ocultar la presentación sin perder información ni progreso; con movimiento reducido usa evidencia estática y las mismas acciones.

Cuida la dirección de arte: debe sentirse como cristal húmedo nocturno, con densidad desigual, pequeñas zonas despejadas y contacto difuso de palma/dedos. Conserva la identidad carbón/petróleo/hueso/cobre del escritorio; el frío del cristal y el reflejo cálido pueden aportar profundidad. La sombra es secundaria y la mano el foco. Nada de un rectángulo borroso uniforme, icono de mano flotante o partículas genéricas que oculten la falta de composición. Elige un estilo ilustrado coherente antes que un falso fotorrealismo débil. Evalúa una captura PC silenciosa para comprobar material, contacto y legibilidad, además del funcionamiento del código.

Resuelve en el diseño la identidad/plano de la aparición, disparador de progreso, fuentes de ECHO, coordenadas al arrastrar/redimensionar, datos del gesto/captura, teclado, persistencia y cancelación. Nada de animaciones que decidan el resultado, escenas que se repitan al reabrir ni gestos que secuestren los botones o la captura del puntero de las ventanas. El terror debe poder convivir con un escritorio usable.

### 4F. Un solo caso de cuatro programas que quepa en la demostración

El video oficial debe durar menos de tres minutos; eso no fija la duración de una partida. Revisa el documento22 para las fuentes y límites: se verificaron metadatos de 2:52 para InteractionKit, primer puesto 2025, y 3:00 para SpookBnB, tercer puesto 2025. No son cronometrajes de sus juegos ni una recomendación de llegar a tres minutos exactos este año.

La recomendación de Codex es TERMINAL -> ECHO -> CANVAS -> POSTMAN -> TERMINAL: estabilizar una petición que vuelve, obtener evidencia visual real, hacer legible/componer su contenido con una operación de imagen, resolver su correspondencia y devolver un acuse válido a la petición inicial. Cada paso transforma un dato o capacidad que el siguiente usa; ninguno existe solo para recoger una llave de color. Cuestiona y mejora el recorrido si CANVAS o POSTMAN no resultan necesarios o si sus operaciones son superficiales.

Define antes de implementar: objeto/petición inicial, contenido que realmente conserva ECHO, información que CANVAS puede revelar porque ya estaba codificada, destinatario/ruta de POSTMAN con evidencia visible y recibo que TERMINAL acepta. Nada de imágenes que mágicamente matan procesos, direcciones adivinadas ni acuses fabricados. El documento22 propone contratos, pero no sustituye resolver el contenido concreto.

La primera reparación y la mano/vaho son un hito intermedio; el final auténtico llega cuando el resultado de la cadena resuelve la petición de TERMINAL y la superficie se libera. Conserva la alegría del avance sin adelantar una pantalla de caso completado. Distingue recuperación de una app, checkpoint de desarrollo y cierre global en modelo, UI y guardado. Un antiguo final de TERMINAL no puede completar la futura cadena de cuatro.

Diseña para aproximadamente 6–9 minutos de primera partida y una ruta conocida de unos 110 segundos que muestre causa -> acción -> resultado de las cuatro contribuciones. Son objetivos sin medir: no impongas una cuenta atrás ni esperas para fabricar duración. Reserva unos 25 segundos del video al público/promesa, 110 al recorrido y cierre, 25 al Kiro realmente usado, 10 a la conclusión y 5 de margen. PITCH.md contiene la tabla y narración provisional; no grabes afirmaciones de funciones que aún no existen.

Aplica la prueba de quitar cada programa: si su operación desaparece y el mismo dato llega al mismo desenlace, no está justificado como paso obligatorio. Mejora su contribución o recomienda menos alcance con razones; cuatro apps por sí solas no suman innovación. Usa pistas progresivas e introducción contextual para no enseñar cuatro interfaces de golpe. Deja diálogos extra, inspección técnica y experimentos posteriores fuera del camino obligatorio.

Haz los traspasos compactos y comprensibles: Open in CANVAS sobre el artefacto real de ECHO, Compose with this sobre la composición interpretada y Return to the request sobre el recibo real pueden abrir el siguiente contexto con sus datos. No conviertas los programas en pantallas genéricas vacías ni automatices las decisiones importantes. Las ventanas siguen pudiendo abrirse, moverse y cerrarse normalmente.

La ejecución de este encargo sigue acotada al checkpoint de dos apps y su escena global. Debes diseñar la cadena completa, sus dos apps siguientes y los presupuestos de tiempo desde ahora. No implementes pantallas falsas del resto para aparentar un final. Después de la integración real habrá que cronometrar una ruta completa y la presentación dos veces. Si no cabe, simplifica; no inventes un modo demo que salte los estados ni muestres un video triunfal en lugar del resultado funcional.

## 5. Qué debe ser diferente al terminar

- Un recorrido completo desde la aplicación poseída hasta el retorno a una función recuperada, visible en **`/haunt.html`**, no en un mockup o ruta oculta aparte.
- Un grafo y criterio de cierre del caso final de cuatro programas, diferenciados del checkpoint que se implementa ahora, con un presupuesto de tiempo y una razón real para cada contribución.
- Al menos dos decisiones conectadas con consecuencias que modifiquen el estado o un artefacto útil del encuentro. No valen solo diálogos, colores o números distintos. No hagas dos candados inconexos para cumplir una cuota.
- Una razón comprensible para abrir ECHO, una capacidad exclusiva que aporte y una diferencia observable en el otro programa. Esto debe funcionar, no aparecer solo en la documentación.
- Un momento de descubrimiento y un final que recompensen lo que el jugador hizo. No dependas de una biografía triste añadida al final ni de la palabra secreta que el jugador debe adivinar.
- Un cambio global del escritorio vinculado a progreso real, con una escena completa de presencia/vaho/huella o una alternativa mejor justificada. El jugador debe poder relacionar causa, observación, intervención y resultado. El artefacto final debe reflejar la partida si la mecánica elegida lo produce.
- Instrucciones y señales claras, pero sin convertir todo el juego en “haz clic exactamente aquí”. Pistas progresivas y asistencia explícita son válidas; reconocer su uso no debe castigar al jugador.
- Undo/retorno/reintento sin pérdida accidental. Cierre, pausa, sonido opcional, teclado y movimiento reducido siguen siendo fiables. Ninguna ventana puede impedir salir de verdad.

Puedes evolucionar los finales y el formato de guardado si la nueva mecánica lo necesita. Diseña una migración/versionado explícitos: un final antiguo no debe completar falsamente el nuevo caso, y no se borran datos ajenos ni todo el localStorage. Ofrece empezar el nuevo caso y consultar/restaurar lo anterior cuando sea coherente. No dependas de pedir al usuario que borre la caché para que tu juego funcione.

## 6. Evita repetir el problema de la entrega anterior

La entrega 2 corrigió ingeniería e hizo el mismo núcleo más fácil de recorrer. Eso merece crédito, pero no equivale a un cambio de juego. Esta vez necesito una tabla de ANTES/DESPUÉS que compare verbos, decisiones, datos producidos y consecuencias, no simplemente botones reubicados.

Incluye una identificación discreta de esta versión en el menú de sesión/acerca de, con instrucciones claras para abrir la URL local correcta. Sirve para que el participante distinga un navegador sin actualizar de una mejora realmente pequeña; no debe invadir la ficción.

Muestra capturas PC de la misma secuencia antes/después y verifica los cambios funcionando. No recortes capturas para ocultar problemas ni llames a un cambio “sobresaliente” por tener más líneas de código o tests.

## 7. Proceso y verificación

1. Inspecciona archivos y UI actual. Guarda el punto de partida y documenta las decisiones actuales; no reviertas el trabajo entregado. Lee review19, incluidos los resultados y límites de sus comprobaciones.
2. Escribe `.kiro/specs/pc-agency-v3/requirements.md`, `design.md`, `tasks.md` y `design-review.md`: incluye alternativas de mecánica, la elegida, recorrido jugable, cambios reales de TERMINAL/ECHO, campana/escritura contextual, datos/eventos compartidos, estados de recuperación, arrastre, guardado y criterios de aceptación. Añade a design.md el arco del escritorio y su escena global: causa, planos, fuentes, gesto, artefacto y tabla de coreografía. En design-review.md contrasta la escena del documento21 con una alternativa propia. Añade `next-programs.md` con los dos siguientes encuentros y sus contratos listos para desarrollar, marcando cualquier incógnita que no logres resolver. Pasa después a implementar el caso de dos apps y su escena global, no te quedes en ideas o en CSS.
3. Implementa el arrastre obligatorio y la mecánica elegida con un checkpoint coherente de dos apps y la escena global. Mantén el criterio de final de cuatro apps como diseño de integración; no lo des por ejecutado. Revisa el resultado en PC y corrige composición, legibilidad y flujo. No empieces más aplicaciones en este incremento, no instales otro framework ni dependas de generación de IA en tiempo de juego.
4. Prueba arrastre de ambas ventanas, soltar fuera del marco, botones sin drag accidental, teclado/reset, cambiar tamaño durante/después, minimizar/restaurar/cerrar durante movimiento y cambios de escena. Prueba dos ventanas activas y foco al alternar.
5. Crea pruebas semánticas para el nuevo recorrido, intervenciones incorrectas, recuperación, artefactos compartidos, ambos desenlaces que conserves, migración y comandos reales del juego. Las pruebas antiguas de infraestructura deben seguir protegiendo su comportamiento. Si el puzzle viejo se retira, conserva su procedencia y reemplaza/mueve sus pruebas con justificación: no mantengas a la fuerza una mecánica rechazada solo para no cambiar un test, y no borres fallos para fabricar verde.
6. Ejecuta build, unitarias y los recorridos pertinentes contra la versión compilada después de terminar el build. No afirmes que una cancelación con AudioContext falso demuestra que se oyó el sonido. Un viewport reducido tampoco demuestra una prueba real de zoom del navegador o dispositivo físico. Expón esos límites.
7. Recorre la versión como alguien sin documentación: ¿por qué abre ECHO?, ¿qué sospecha?, ¿qué puede intentar?, ¿qué efecto reconoce?, ¿qué creó/conservó?, ¿cuándo sabe que terminó? Una simulación de agente no es una prueba humana. Si no hay personas disponibles, entrega un protocolo breve y declara que la diversión sigue sin validarse.
8. Verifica el momento global: solo nace de su progreso real, el rastro se mantiene en el plano correcto al mover ventanas, cada fuente de ECHO contiene lo que corresponde, la captura retiene los datos reales del gesto/estado y una intervención equivocada se entiende y se recupera. Prueba teclado, omitir, Undo, minimizar/cerrar, ocultación de página, movimiento reducido y recarga/migración sin duplicar la escena ni perder el progreso. No vale probar solo que existe una clase de niebla o que pasó un temporizador.
9. Entrega el grafo de cuatro programas y una estimación de acciones/esperas contra el presupuesto de 110 segundos, marcando lo estimado y lo cronometrado. Actualiza la ruta y PITCH.md si cambias el concepto. No llames al checkpoint actual una prueba del tiempo total ni del final integrado; sus mediciones quedan pendientes hasta que existan las cuatro contribuciones.

Trabaja el tiempo necesario e itera sobre el resultado real. No hay una fecha de corte artificial de esta sesión ni una obligación de estar dos horas esperando. Termina por criterios cumplidos y riesgos honestos, no por tiempo gastado.

## 8. Límites y entrega

No publicaciones, git push, envíos, compras, cambios de cuenta/región, dependencias nuevas innecesarias ni acceso a procesos reales del SO. Conserva la app histórica index/src/core y la atribución de Codex/Kiro. Nada de credenciales ni razonamiento privado en los archivos. El juego puede imitar programas poseídos, no ejecutar código peligroso del usuario.

Al terminar informa:

- Qué concepto elegiste y qué descartaste por ser superficial.
- Qué aceptaste/cambiaste/rechazaste de la opinión de Codex, por qué, cómo se relacionan TERMINAL/ECHO/campana y cómo responde el fantasma a acciones reales.
- Qué cambió realmente en las acciones y consecuencias de TERMINAL y ECHO.
- Cómo se arrastran las dos ventanas, cómo se recupera su posición y qué se verificó en PC.
- Un recorrido reproducible con el artefacto/estado que el jugador crea, un intento equivocado y su recuperación.
- Qué archivos, specs y pruebas cambiaste; resultados reales, límites y errores pendientes.
- Cómo reconocer esta versión al abrir `/haunt.html` y qué hacer si existe un guardado anterior.
- Qué dos programas adicionales propusiste, qué interacción distinta aporta cada uno y qué queda diseñado frente a realmente implementado.
- Qué momento global construiste, qué lo causa, qué descubre/hace el jugador y cómo se relaciona con el resultado. Adjunta evidencia PC de su secuencia y del artefacto real; separa lo implementado de la culminación futura de cuatro apps.
- Cómo las cuatro contribuciones se necesitan, qué cierra de verdad la petición inicial y cómo encaja el recorrido en el video. Reporta estimaciones y mediciones por separado.

No cierres con una garantía de premio ni una puntuación subjetiva de calidad. Entrega una experiencia que el participante pueda distinguir y jugar, no solo una afirmación de que ahora es mejor.
