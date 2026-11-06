# Programas muertos · propuesta de reemplazo

5 de noviembre de 2026. Origen: el participante autorizó cambiar la idea central y propuso un sistema operativo con diseño de Halloween, programas muertos que regresan, personalidades propias y un ayudante. Mencionó una consola antigua que pide no ser terminada y programas que puedan descansar en paz.

**Estado: dirección candidata, no diseño cerrado ni aplicación implementada.** La ventana equivocada sigue conservada como prototipo anterior. Sus pruebas validan ese software, no esta nueva experiencia. Este documento desarrolla la propuesta del participante; no reclama invención mundial ni posibilidad de premio demostrada.

**Instrucción posterior del participante:** detener el código y cuestionar/mejorar también esta idea. Las pruebas de concepto que se mencionan abajo no se programarán todavía. `06_Exploracion_funciones_heredadas.md` estudia un cambio más profundo de interacción; tampoco está aceptado como idea final.

## Situación y público

Un escritorio ficticio dentro del navegador, dirigido a personas que disfrutan de la tecnología y a programadores principiantes. Durante una última sesión de Halloween reaparecen programas retirados. Tu encargo es conseguir un apagado limpio y darles un cierre, averiguando qué los mantiene ligados a la sesión.

Tono propuesto: misterio tecnológico, humor incómodo y despedidas breves. No es necesario convertirlos en monstruos malvados. Su forma de hablar y de aparecer nace de su función: una consola se expresa con su último comando; un editor con una línea sin guardar; un servicio con una promesa de reinicio que sigue cumpliendo.

Todo sucede en una simulación. Los procesos, archivos y órdenes son del juego; no son los de la computadora del jugador. La interacción principal puede ser gráfica y el terminal será una alternativa explicada, si aporta algo.

## Bucle principal

Observar una aparición → consultar su ficha y el registro de eventos → relacionar una causa con el síntoma → ejecutar una intervención → comprobar que la causa desapareció y escuchar/ver la despedida.

El ayudante explica herramientas y ofrece pistas solicitadas. No entrega inmediatamente la intervención resuelta. Su explicación debe ser comprensible, pero no sustituir el diagnóstico. No se propone un ayudante maligno como giro obligatorio.

## Tres casos que deben ser distintos de verdad

| Caso candidato | Personalidad y síntoma | Descubrimiento/intervención | Consecuencia visible |
| --- | --- | --- | --- |
| La consola pendiente | «No me cierres. Todavía falta una línea». Un trabajo o salida sin completar mantiene su sesión abierta | Investigar qué falta y permitir que termine/guardar la salida antes del cierre solicitado | La última línea queda preservada y la consola termina su sesión |
| El programa que regresa | «Me dijeron que nunca me detuviera». Al terminarlo vuelve con una nueva identidad de proceso | El registro muestra un supervisor que lo reinicia; cambiar esa causa y comprobar el siguiente cierre | La aparición deja de regenerarse y cambia su despedida |
| El registro que no se va | Su último mensaje está fechado antes de la terminación. No está ejecutándose aunque permanezca en la lista | Reconocer un estado zombi; el proceso padre debe recoger su salida. Enviar otra orden de terminación no resuelve ese estado | La entrada pendiente desaparece sin fingir que volvió a morir |

Son candidatos a reglas, no tres implementaciones ya validadas. La consola no debe ser una espera o una instrucción trivial de guardar; necesita una pequeña investigación comprensible. Los casos comparten herramientas y aportan pistas sobre la sesión. Debe existir una relación narrativa comprobable entre ellos para evitar una colección de ejercicios independientes.

## Recorrido de ejemplo

Entras a un escritorio aparentemente retirado. Una consola se abre y pide no ser cerrada. El ayudante permite inspeccionarla antes de actuar. Descubres una salida pendiente y consigues una despedida.

Otra ventana reaparece después de que la terminas. El registro conserva cada cierre y muestra qué servicio la ha vuelto a iniciar. Esta vez no sirve repetir la primera solución: intervienes en la fuente del reinicio.

El último «fantasma» no está vivo. Su mensaje es una salida archivada, no una respuesta nueva a tus clics. Resolverlo exige interpretar el estado y la relación con su padre. El escritorio recupera una situación coherente.

El apagado final debe reconocer lo que realmente hiciste y conservar un pequeño registro de la sesión: qué estaba pendiente, qué causa resolviste y qué se pudo recuperar. El ayudante puede despedirse también cuando concluye su función; esto sigue siendo una posibilidad narrativa, no un giro aceptado.

## Qué podría diferenciarnos y qué no está demostrado

La apuesta es hacer que cada personalidad, aparición y despedida sea una consecuencia de su comportamiento técnico, con una investigación causal que cambia de un programa a otro. El fin es cerrar su historia y el sistema, no acumular clics sobre fantasmas.

Ya existen juegos de escritorios ficticios y proyectos de limpieza con estética sobrenatural. [The Digital Exorcist](https://devpost.com/software/the-digital-exorcist) describe gestión/limpieza de archivos; [Zombie Blaster](https://devpost.com/software/zombie-blaster) convierte identidades AWS sin uso en enemigos. No debemos atribuirles premios generales: sus fichas consultadas indican premios de blog y de Social Blitz, respectivamente. [Seance](https://devpost.com/software/seance) y [SpookBnB](https://devpost.com/software/spookbnb-when-dark-mode-gets-truly-dark) sirven como referencias de experiencia temática, no como modelos que copiar.

Un antecedente más cercano encontrado después es [Zomb-Kill: The Gamified Process Hunter](https://devpost.com/software/zomb-kill-the-gamified-process-hunter): su ficha indexada describe gestión de procesos como caza de supervivencia/terror y procesos con alto uso de CPU como enemigos que requieren clics repetidos. La página devolvió 403 al abrirla; esto es evidencia de su descripción indexada, no una prueba práctica de su funcionamiento. La caza de procesos con tema zombi por sí sola no es una diferenciación demostrada.

No está demostrado que nuestra combinación sea inédita, entretenida, emotiva, pedagógicamente efectiva o competitiva. Hay que buscar precedentes específicos y probar una interacción antes de ampliar el elenco.

## Contrato técnico y límites a resolver

- Un proceso reiniciado por un supervisor y un proceso zombi son estados distintos. No se usarán ambos nombres como sinónimos de un fantasma animado.
- En Unix, `SIGKILL` no permite al proceso ejecutar una despedida o guardar después de recibirla. La voz previa o un último mensaje archivado deben distinguirse de una reacción posterior.
- `SIGTERM` tampoco garantiza guardar: la despedida solo se produce si el personaje/programa implementa explícitamente ese manejo. No confundir la posibilidad de atender una señal con una garantía del sistema operativo.
- La estética de una consola de Windows no convierte las señales Unix en órdenes de CMD. Elegir una convención de simulación explícita o una familia real de comandos antes de diseñar el terminal.
- Las consecuencias deben poder entenderse sin audio, reflejos rápidos o conocimientos previos de señales. El público técnico puede reconocer detalles adicionales.
- La opción de terminar todo indiscriminadamente no debe resolver el diagnóstico. Sus consecuencias deben ser claras y recuperables dentro del juego.
- Una intervención incorrecta no puede destruir la única pista indispensable y dejar la sesión bloqueada. Definir un punto de recuperación o una fuente alternativa antes de introducir esa consecuencia.
- Precisar herramientas, pistas disponibles, relación narrativa, recuperación y cierre antes de programar una versión nueva.

Fuentes técnicas revisadas: [wait y procesos terminados](https://man7.org/linux/man-pages/man2/wait.2.html), [señales](https://man7.org/linux/man-pages/man7/signal.7.html), [reinicio de servicios](https://www.freedesktop.org/software/systemd/man/latest/systemd.service.html) y [taskkill en Windows](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/taskkill).

## Prueba de concepto que podría rechazar la propuesta

Construir solo el caso del programa que regresa: cerrar una ventana, observar su nueva aparición, encontrar evidencia de qué la reinicia y actuar sobre esa causa. Una persona ajena a la solución debe poder explicar lo que pasó y qué cambió su intervención. Observar si investiga o simplemente prueba botones, y si el personaje genera interés más allá de su frase inicial. Una auditoría de agentes no reemplaza esa observación.

La [revisión documental de Kiro](../development/dead-programs-review.md) identifica otros dos riesgos a comprobar: personalidades reducidas a texto decorativo y casos que resulten ejercicios independientes sin relación narrativa. Resolverlos sigue pendiente. No basta con que los tres personajes tengan botones de cierre distintos.

El encaje propuesto es **Costume Contest**: Halloween tendría que estar integrado en el comportamiento de la interfaz. No se reclama aprobación de organizadores ni se eliminan las restantes obligaciones de Kiro, fuente, entrega y demostración de las [bases oficiales](https://kiroween.devpost.com/rules).
