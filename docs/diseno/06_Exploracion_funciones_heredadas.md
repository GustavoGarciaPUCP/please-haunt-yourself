# Exploración crítica · funciones heredadas

5 de noviembre de 2026. El participante pidió detener el desarrollo de código y trabajar en innovación, cuestionando también su propia propuesta. Este documento es exploración de diseño, no una especificación aprobada, un resultado de pruebas ni una afirmación de originalidad mundial. No cambia la aplicación existente.

## Qué no alcanza en la propuesta anterior

Un escritorio con programas que suplican puede aportar humor y personajes. El ciclo «leer síntoma, pedir ayuda, ejecutar cierre, ver despedida» todavía puede convertirse en un tutorial de administración de procesos. Cambiar el diálogo de cada ventana no cambia necesariamente lo que se juega. La ampliación necesita una acción que altere las posibilidades del jugador.

Conservaría el escritorio ficticio, los programas con personalidad, la presencia de Halloween y la idea de una última sesión. Replantearía el objetivo de eliminarlos a todos y el ayudante que entrega órdenes resueltas. La fidelidad a Unix no debe impedir una ley sobrenatural clara: esta dirección sería ficción interactiva inspirada en software, no un simulador certificado de sistemas operativos.

## Direcciones consideradas

| Dirección | Qué aporta | Problema | Decisión provisional |
| --- | --- | --- | --- |
| Diagnosticar cierres distintos | Causas observables y un público técnico definido | Puede ser una serie de botones de diagnóstico con texto decorativo | Conservar como material narrativo, insuficiente como principal diferenciación |
| Fantasmas que repiten acciones anteriores | Cooperación con el pasado y comportamiento visible | La grabación/repetición tiene precedentes claros; una repetición de clics tampoco garantiza una experiencia propia | Alternativa, no asumir que es una innovación nueva |
| Una función de un programa muerto puede poseer otra parte del escritorio | Los programas pasan a ser personajes y herramientas; el cierre cambia las acciones disponibles | Puede degenerar en combinar una llave con su cerradura o en magia arbitraria | Candidata que recomiendo desarrollar en papel y someter a objeciones |

La comparación anterior es juicio de diseño, no una puntuación de jurado ni evidencia de diversión.

## Ley candidata: cerrar una ventana no extingue todo lo que sabía hacer

Un programa deja su función característica como presencia utilizable. El jugador puede llevarla a otra ventana, donde conserva un significado predecible. La interfaz poseída cambia de comportamiento y deja visible de quién heredó esa capacidad.

Ejemplo de contraste de funciones, todavía sujeto a revisión:

| Función | Significado estable | Dos aplicaciones de la misma regla |
| --- | --- | --- |
| Deshacer | Invierte una transición registrada del objeto que la recibe | Recuperar el último archivo borrado de una carpeta; restaurar una entrada retirada de un registro |
| Pausa | Detiene el avance automático de una actividad del objeto que la recibe | Suspender un trabajo de reinicio programado; detener una transferencia automática |

No se propone que Deshacer invente archivos ni que Pausa resuelva cualquier obstáculo. Necesitan objetivos con un historial o actividad observables. Las consecuencias deben poder anticiparse por esa información, no descubrirse únicamente probando pares.

El Deshacer de un fantasma puede acceder al historial anterior al inicio de la partida. Una opción externa de deshacer movimientos del jugador solo recuperaría sus decisiones durante la partida; no sustituiría esa capacidad del personaje.

Revisión posterior: el límite candidato es un receptor activo por función, no una sola función por ventana. Dos funciones diferentes pueden actuar en una misma ventana si sus operaciones tienen sentido allí. Así se permite combinar en lugar de imponer una restricción para fabricar dificultad.

La asignación ofrece un control; no es un aura. Un cambio ya ejecutado, como pausar una actividad, no se deshace por mover la función a otra parte. Para reanudar se utiliza el control correspondiente de Pausa/Continuar. Esta interpretación debe mantenerse en todos los receptores.

## Escena completa propuesta, sin código

**Situación:** falta el archivo que permite reconstruir por qué la sesión no pudo terminar. Su carpeta conserva una entrada de borrado. Un servicio mantiene la carpeta vacía de nuevo después de cierto número de acciones. El jugador puede inspeccionar esa actividad y su próxima ejecución; leer no consume acciones ni exige reflejos.

**Encuentro:** un editor antiguo permite ver su propio historial y Deshacer en un contexto familiar. Al cerrar su ventana, la función permanece como una presencia visible. La despedida podría ser: «Todavía puedo deshacer algo por ti». La función se puede seleccionar y aplicar sin arrastre.

**Descubrimiento:** el jugador aplica Deshacer a la carpeta. El archivo vuelve porque se invierte el borrado registrado, pero el servicio vuelve a retirarlo. El registro conserva ambos acontecimientos. La explicación no depende de un ayudante que revele el siguiente botón.

**Combinación:** un reproductor detenido conserva Pausa. El jugador la aplica a la actividad del servicio, comprueba que ya no avanza y usa Deshacer para recuperar el archivo. Una capacidad que conocía en un reproductor interviene ahora en otro comportamiento del mismo escritorio.

**Consecuencia:** el archivo recuperado revela información concreta sobre la sesión, y el programa que recibía una capacidad ajena cambia de aspecto y reconoce su procedencia. Hay que precisar esa información y su relación con las demás aplicaciones; «se revela un misterio» no cuenta como argumento escrito.

Esta escena aún NO demuestra un puzzle cerrado. Siguen abiertas las vías de saltarse al servicio, guardar una copia, pausar todo desde fuera o recuperar el archivo por otra herramienta. Algunas pueden ser soluciones legítimas. Habrá que distinguirlas de contradicciones con las reglas y comprobar una secuencia de estados en papel antes de llamar resuelto el diseño.

## Recorrido que debería sostener la versión completa

1. **Aprender una capacidad familiar en su programa.** El primer personaje tiene una tarea y una relación visibles con la sesión, no solo una frase simpática.
2. **Descubrir que puede actuar después de cerrar.** Su función cambia las posibilidades reales de otra ventana. La nueva regla se muestra antes de exigir combinaciones difíciles.
3. **Resolver relaciones entre programas.** Reutilizar una función en más de un contexto y combinar efectos, con una investigación narrativa común. No contar cada uso como un acertijo nuevo.
4. **Decidir qué permanece al cerrar la sesión.** El final debe expresar las capacidades y el trabajo recuperados mediante las acciones realizadas. Se estudiará una pequeña utilidad final compuesta por lo heredado; no es una función aceptada ni un producto general de reparación de computadoras.

La relación entre personajes, el hecho que originó las apariciones y el contenido recuperado aún no están escritos. No se ocultará ese trabajo pendiente bajo una promesa de giro final o un ayudante maligno.

## Por qué investigar esta dirección

Aquí el cierre podría ser una decisión sobre herramientas, no solo la eliminación de un enemigo. La posesión sería el modo de utilizar la interfaz. El apego a un programa tendría una consecuencia práctica: aquello que hacía continúa ayudando en otra parte, y la despedida se entiende por el uso que el jugador le dio.

Esa combinación es una hipótesis propia de esta exploración. No acredita que nadie haya usado algo parecido. Requiere comparación más específica y comprensión/diversión observadas cuando se autorice prototipar.

## Precedentes consultados y límites de la búsqueda

- [Baba Is You](https://store.steampowered.com/app/736260/Baba_Is_You/): manipular reglas y cambiar comportamientos ya es una familia de diseño existente. No atribuirnos su invención.
- [Ghost Trick](https://store.steampowered.com/app/1967430/Ghost_Trick_Phantom_Detective/): posesión de objetos y manipulación temporal con personajes también tienen antecedentes.
- [The Last Clockwinder](https://store.steampowered.com/app/1755100/The_Last_Clockwinder/): grabar acciones y coordinarlas mediante repeticiones tampoco es una novedad por sí solo.
- [There Is No Game](https://store.steampowered.com/app/1240210/There_Is_No_Game_Wrong_Dimension/) y [Outcore](https://store.steampowered.com/app/1275670/Outcore_Desktop_Adventure/) son comparadores para aventura e interfaz; sus fichas no sustituyen una prueba práctica de sus interacciones.

Se consultaron fichas primarias publicadas, no se jugaron estos títulos durante la revisión. Una búsqueda sin encontrar un caso idéntico no probaría ausencia de precedentes.

## Objeciones que pueden descartar la candidata

- Si una función solo sirve en un receptor exacto, sin regla reutilizable, se reduce a una llave disfrazada.
- Si la función necesita una explicación diferente en cada receptor, la lógica es arbitraria.
- Si las capacidades ordinarias del escritorio ya resuelven todo, la posesión es decorativa.
- Si la historia se limita a pedir que conserves algo sin concretar qué se perdió y por qué importa, sigue faltando argumento.
- Si el jugador no puede anticipar ni explicar consecuencias después de conocer la regla, la carga de interpretación será excesiva.
- Si el interés depende únicamente del aspecto de los fantasmas, todavía no habremos encontrado la interacción que buscamos.

La siguiente tarea es refutar o mejorar estas reglas en papel y escribir la situación narrativa. Por instrucción del participante, no se programará este concepto en esta etapa.

## Revisión posterior: evitar la llave con una sola cerradura

Kiro produjo una [crítica de esta candidata](../development/inherited-functions-objections.md). Se retiene la advertencia de opacidad, pero se rechazan sus ejemplos de borrar una bitácora para cambiar el mundo y sus umbrales numéricos no fundamentados. La regla se precisa así:

- **Historial de un objeto:** guarda los estados necesarios para invertir cambios de ese objeto. Tenerlo no implica disponer ya de Deshacer. El jugador puede consultarlo antes de elegir receptor y sabe si hay cambios reversibles.
- **Bitácora de observación:** cuenta lo sucedido; no gobierna el estado del mundo. Quitar una línea, si se permitiese, no desharía el suceso. No es un receptor de Deshacer en esta candidata.
- **Actividad automática:** un objeto puede mostrar una actividad en curso y cómo se activa. Pausa/Continuar cambia ese avance sin congelar el resto del escritorio. La actividad se identifica antes de necesitar la función.
- **Asignación comprensible:** la interfaz describe la propiedad del receptor y el efecto previsto; no muestra un indicador de combinación ganadora. Un receptor compatible puede ser irrelevante para el objetivo.
- **Generalización exigida:** Deshacer debe servir de manera consistente en contenido de un documento y en operaciones de una carpeta; Pausa debe servir en una reproducción y en una actividad del sistema. Si esos efectos requieren reglas distintas inventadas para cada caso, esta candidata falla.

Estas son leyes de un escritorio ficticio. No se presentan como capacidades normales de Windows, Linux o un proceso terminado.

### Recorrido manual de una escena

Esto es un análisis escrito de estados propuestos, no un ensayo del software ni una observación de jugadores.

**Estado de partida:** una carpeta Borradores contiene la huella de un borrado anterior a la partida, con información suficiente para invertirlo. La bitácora identifica una tarea del sistema que vuelve a retirar archivos recuperados de esa carpeta. Su configuración inicial no tiene un cambio anterior guardado que Deshacer pueda revertir. Un Archivo de sesión queda fuera de esa vigilancia. Las herramientas del sistema no son las aplicaciones antiguas que se retiran al cerrar una ventana.

| Acción candidata | Consecuencia según las reglas |
| --- | --- |
| Inspeccionar la carpeta y la tarea | Muestra el cambio reversible, la vigilancia de Borradores y la actividad automática. Leer no consume tiempo ni desencadena acciones |
| Cerrar el editor después de conocer su Deshacer | Queda disponible su función heredada; no se cambia la carpeta por ese cierre |
| Aplicar Deshacer a Borradores | El archivo vuelve y la tarea lo retira otra vez. La bitácora muestra ambos hechos en orden. Esta consecuencia es causal, no un castigo por una combinación incorrecta |
| Cerrar el reproductor y asignar Pausa a la tarea | El resto del escritorio sigue funcionando; esa actividad deja de reaccionar a recuperaciones |
| Volver a utilizar Deshacer en Borradores | Recupera el archivo sin que la tarea lo vuelva a retirar mientras está pausada |
| Mover el archivo al Archivo de sesión | El contenido queda fuera del ámbito de la tarea, mediante una operación normal y visible |
| Reanudar la tarea | No elimina el archivo archivado porque solo vigila Borradores. La solución conserva su resultado después de quitar la contención |

### Intentos de romper este recorrido

- **Deshacer en la tarea:** no puede inventar una configuración anterior inexistente. Esa ausencia debe ser visible antes de actuar. En otro caso donde haya un cambio reversible, debería poder servir; no se prohibirá para forzar Pausa.
- **Cerrar el visor de tareas:** cierra la vista, no la actividad observada. Es una regla general del escritorio, no una excepción de este puzzle.
- **Finalizar la tarea por una orden alternativa:** si más adelante se ofrece una herramienta que realmente la detenga, esa debe ser una solución válida o tener una consecuencia concreta y anticipable. La versión candidata todavía no promete una consola de administración irrestricta.
- **Pausa externa de la partida:** detiene la escena y las acciones que la modifican, permitiendo lectura, ayuda y preferencias. No sirve para ejecutar una recuperación con el mundo detenido. No hay prueba de reflejos.
- **Deshacer movimientos del jugador:** vuelve a estados posteriores al inicio de su partida; no recupera por sí solo el borrado histórico que origina el caso.
- **Mover la función Pausa:** no reanuda automáticamente lo ya pausado. Un control ejecuta un cambio, no mantiene un hechizo por proximidad.
- **Copiar o recuperar por otro medio:** si esas funciones se incorporan al escritorio, deberán analizarse como rutas posibles. No se declarará una solución única sin revisar todas las acciones disponibles.

El recorrido es coherente bajo estas condiciones propuestas. Eso no demuestra que sea entretenido ni que las condiciones se entiendan. Tampoco certifica el argumento completo: la identidad del contenido recuperado y su importancia para los personajes siguen siendo una decisión creativa pendiente.

### Recompensa final que vale estudiar

En lugar de una felicitación, el escritorio que queda podría conservar las funciones heredadas en los lugares donde el jugador les encontró una utilidad. Las ventanas originales pueden despedirse y cerrarse, mientras su trabajo sigue disponible. Esa consecuencia surgiría de las asignaciones realizadas; no sería una imagen que simula haber construido algo.

Una prueba de generalización en papel sería proponer un receptor nuevo que ya tenga un historial y una actividad visibles. El jugador debería anticipar qué harían Deshacer y Pausa sin aprender otro acertijo de nombres. La presentación, la emoción y la diversión requerirán observación real cuando se retome el desarrollo. Hasta entonces, esta dirección sigue en exploración.

## Refinamiento que añade una decisión real: devolver la herencia

La candidata resulta más interesante si se puede restaurar un programa desde un estado previo conservado, pero **al volver recupera la función que había dejado**. Así la resurrección cambia de nuevo las herramientas disponibles. No crea una copia de su habilidad ni rebobina todos los demás objetos.

Reglas adicionales a estudiar como parte de la misma mecánica:

1. Cada personaje y cada función tienen una sola identidad. La función pertenece a su programa mientras está activo; después puede asignarse a otro receptor.
2. Deshacer puede restaurar el estado anterior registrado de un objeto, incluido un programa ficticio cuyo estado se haya conservado. No inventa una vida anterior sin registro.
3. Si se restaura al donante, su función vuelve a él. La asignación prestada termina de forma visible. Los efectos ya ejecutados en otros objetos permanecen, porque restaurar al donante no rebobina el mundo completo.
4. Esa restitución se anuncia antes de confirmar; no se utiliza como una trampa que el jugador solo descubre cuando pierde la herramienta.

**Ejemplo legible en papel:** una consola fue terminada antes de comenzar la partida y conserva una salida pendiente en su estado anterior. El jugador cierra el editor, hereda Deshacer y lo aplica a ese cierre histórico: la consola reaparece en su estado recuperable. Ahora puede obtener su salida. Más tarde, restaurar al propio editor retiraría Deshacer del receptor que lo estaba utilizando. El jugador debe organizar qué programa necesita activo y dónde necesita la función, no solo reunir objetos.

La interpretación de la consola recuperada debe quedar explícita: es un objeto del mundo ficticio con estado guardado, no una afirmación de que un SIGKILL real se revierte con un botón. Si necesitamos excepciones por personaje para sostener esta regla, se descarta el refinamiento.

Esto añade una tensión defendible: cerrar da una capacidad nueva, devolver una vida puede recuperarte información pero quitar esa capacidad prestada, y ambas decisiones dejan consecuencias. Todavía hay que diseñar un encuentro completo donde esa devolución sea una decisión necesaria o útil, no un giro mostrado únicamente en un diálogo.

## Situación narrativa candidata

El escritorio está preparando una última actualización durante Halloween. El ayudante solo puede enumerar los programas activos y recomienda retirar los antiguos. Su visión es limitada, no maliciosa. Las presencias aparecen donde una función ha quedado sin un lugar; sus voces y gestos provienen de lo que cada programa hacía.

El primer contraste sería observable: el ayudante confirma que ya no hay editores abiertos, pero Deshacer sigue actuando en otra ventana. El jugador comprende algo del escritorio que el ayudante todavía no sabe describir. El personaje no entrega la solución porque no comparte toda la información del jugador.

La misión candidata pasa a ser recuperar un trabajo concreto y dejar un escritorio que pueda continuar sin las ventanas antiguas. Su estado final debería contener capacidades reubicadas por el jugador, con su procedencia reconocible. No bastaría recoger tres fichas y colocarlas en tres huecos preasignados.

Se mantiene una carencia creativa explícita: falta escribir cuál es ese trabajo, para quién importa y qué relaciones concretas revelan los programas. Una carta genérica, un dueño fallecido introducido al final o un ayudante-secretamente-malvado no se aceptan automáticamente como respuesta. El argumento tiene que dar razones a las decisiones jugadas. Esta exploración propone un cambio de mecánica; aún no acredita una historia excelente ni una experiencia validada.
