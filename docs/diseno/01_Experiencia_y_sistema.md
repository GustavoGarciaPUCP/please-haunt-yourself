# Experiencia y sistema · V3 · Cierre R1

## 1. Qué experiencia elegimos construir

Un taller de teatro de papel dentro del navegador. Una figura quiere llegar a una galería alta cuyo acceso ya existe; el problema es que falta camino. Vera dejó la observación **«Hay salida. Falta camino»**.

Hay un recorte de papel montado en un pivote, una lámpara sobre un riel y un marco negro transportable. La proyección inicialmente alta resulta inquietante, pero no se describe como un enemigo que persigue. El jugador modifica causas visibles y construye una ruta. No hay un giro tardío de «el monstruo era bueno».

El escritorio ficticio organiza las vistas del escenario y sus mecanismos. No controla el sistema operativo, archivos del jugador ni aplicaciones reales. El escenario es 2D; no necesita un servicio de IA durante la partida ni un motor óptico 3D.

## 2. Tres problemas relacionados, no tres botones que contar

**Entender una causa.** La forma negra es la proyección del recorte visible. Mover la lámpara desplaza la proyección conservando su forma; la altura inquietante no corresponde a otro personaje.

**Separar forma y posición.** Una forma vertical trasladada no proporciona una pendiente caminable. Orientar la plantilla cambia sus pendientes; la lámpara decide dónde cae esa forma. Una orientación adecuada puede seguir separada del suelo inicial.

**Reinterpretar un objeto material.** Incluso una sombra bien colocada deja un hueco antes de la galería. El marco que conocimos como abertura conserva un borde negro de apoyo: puede completar ese hueco, si descansa correctamente. Esto generaliza una propiedad conocida a otro objeto, no concede un poder al final.

Estas comprensiones se combinan en un plan. No requieren presenciar fallos concretos ni se registran mediante banderas de «ya entendió». El jugador puede abordar primero el marco, la lámpara o el recorte. Existen diferentes configuraciones geométricas válidas.

## 3. Leyes que deben estar disponibles desde el comienzo

### Trazos de apoyo

Los perfiles negros del escenario sostienen **desde arriba**. Sus caras laterales no atrapan ni impiden pasar; no son muros macizos. Las pendientes caminables no superan 30°, no hay salto y los pequeños escalones, ascendentes o descendentes, no superan 20 unidades del modelo. El alcance horizontal total de un contacto, incluida la huella y cualquier corrección automática, no puede superar 48: esas tolerancias no se suman entre sí. Estas magnitudes pertenecen a implementación, no a instrucciones numéricas para jugar.

La regla se muestra mediante un contacto local temprano con un trazo pequeño, incluido el paso lateral; no con una demostración de la rampa completa ni del marco-puente. No se usará lenguaje de «pared sólida infranqueable» para una sombra vertical. Es inadecuada como apoyo hacia la galería, pero no encierra a la figura.

### Proyección

La luz y la plantilla están en planos de profundidad fija. La lámpara se desplaza horizontalmente: **traslada la sombra, no la gira ni la escala**. El pivote orienta la plantilla y su proyección. El arco mecánico tiene topes visibles entre 0° y 90°; el extremo de 0° no exige acertar un ángulo diminuto.

La figura que camina no es la fuente de la proyección. Evitamos una plataforma que cambie por el movimiento del cuerpo que se apoya en ella. No se promete óptica libre ni se muestran configuraciones predibujadas arbitrarias como si fueran consecuencias físicas continuas.

### Marco

El marco es una pieza rígida, negra, completa y siempre reconocible. En una pared de papel, retirarlo cierra la abertura que había allí. Moverlo no transporta a la galería a cualquier sitio: el destino sigue en su posición alta. La abertura muestra el contexto local, no una fotografía ni un portal a un destino remoto fijo.

Fuera de una pared, el marco sigue teniendo material. Puede reposar en una superficie amplia o unir dos apoyos planos a la misma altura. Sus dos extremos inferiores deben descansar con contacto suficiente; no queda suspendido sin apoyo. Los patines y contactos se ven desde la primera manipulación. Se previsualiza el asentamiento vertical sobre apoyos, con tolerancia amplia de colocación; no se exige acertar su altura en un píxel. Ese asentamiento no alinea horizontalmente la pieza ni corrige lámpara o plantilla. Una colocación sin apoyo devuelve la pieza a su estado confirmado; no la destruye.

Cada cambio confirmado es una transacción de la configuración completa, también al mover lámpara o plantilla. Durante el ajuste puede verse provisionalmente que un apoyo se pierde, con el contacto señalado. Si al soltar el marco quedaría sin sus apoyos, se rechaza ese ajuste causal y se recupera íntegramente la configuración anterior. No se guarda ni ensaya una pieza suspendida. Para hacer un cambio amplio se puede retirar primero el marco a su anclaje o a una superficie amplia ya disponible; Deshacer permanece accesible.

Su borde inferior soporta como los demás trazos. Los montantes se atraviesan lateralmente conforme a la misma regla general. No se inventa una excepción para entrar en el hueco. El borde tiene espesor visible, un pequeño escalón permitido y espacio interior suficiente para la figura.

## 4. Un escenario y una familia de soluciones

El suelo de partida termina antes de la galería alta. La sombra puede formar una rampa y una meseta, pero las combinaciones que conectan con el suelo no alcanzan por sí solas el refugio. El marco no tiene anchura suficiente para salvar él solo todo el espacio.

Una solución combina:

1. Una orientación del recorte que ofrezca pendiente y meseta útiles.
2. Una posición de luz que haga comenzar ese apoyo sobre el suelo de partida.
3. El marco sobre la meseta y la galería, completando la separación final.

La colocación del marco y de la luz se relacionan: una luz que desplaza demasiado la meseta puede dejar un extremo del marco sin apoyo. Se puede corregir el emplazamiento de la proyección o la posición del marco, dentro de sus límites materiales. El anexo muestra dos configuraciones distintas con margen.

La galería es un lugar fijo y visible, no «cualquier salida». Colocar una abertura junto a la figura no la lleva allí. No se fuerza a hacer los ajustes en un orden concreto ni a pasar por configuraciones erróneas para desbloquear la solución.

## 5. Controles elegidos

Se retira la obligación de interceptar una mano grabada. La manipulación directa permite observar las relaciones del sistema sin añadir una operación a cada prueba. Las vistas siguen perteneciendo al taller, con riel, remache, asa y pieza libre visibles; no se presentan tres deslizadores abstractos sin relación con sus materiales.

| Elemento | Ratón y alternativa sin arrastre | Teclado |
| --- | --- | --- |
| Lámpara | Arrastrar el carro o hacer clic sobre su riel. | Flechas con pasos de 10 unidades; Inicio/Fin para topes. |
| Plantilla | Arrastrar el asa por el arco o elegir un punto del arco. | Flechas con pasos de 5°; Inicio/Fin para topes. |
| Marco | Arrastrar o activar Colocar y confirmar con otro clic; previsualización y Cancelar disponibles. | Mover con flechas, confirmar con Enter, cancelar con Escape. |
| Ensayo | Probar recorrido; Pausar, Continuar o Detener durante la actuación. | Los mismos controles por foco visible y activación habitual. |

La previsualización muestra cambios de forma, posición y contacto, sin un semáforo de «combinación correcta» ni una silueta del marco en el lugar resuelto. No se muestran coordenadas o fórmulas en el producto. El coste de probar debe ser pequeño.

## 6. Entrada y ciclo de juego

La portada presenta el objetivo y permite idioma, sonido y movimiento. Español para navegador en español, inglés en otro caso; elección manual conservada. Sonido inicialmente apagado y movimiento reducido según sistema, modificable. Una acción explícita entra en el taller; no se reproduce una solución mientras se eligen preferencias.

Una actuación breve muestra a la figura reconocer el acceso alto y contactar con un apoyo local. No desplaza automáticamente la lámpara, gira la plantilla ni construye el puente. Puede omitirse; objetivo y controles siguen disponibles.

**Preparar.** La figura espera en su suelo fijo. Los cambios de luz, plantilla y marco tienen respuesta visual inmediata. No hay amenaza que avance, caída ni cuenta atrás. En edición, la figura no es empujada por una sombra que cambie; es un ensayo de configuración, no una simulación dinámica continua sobre su cuerpo.

**Probar.** Al solicitarlo, se fija la configuración y la figura intenta recorrer los apoyos. No se permite retirar la luz o mover el suelo durante el cruce. Una discontinuidad, pendiente excesiva o apoyo insuficiente se expresa donde ocurre; la figura se detiene segura y vuelve al comienzo, conservando la configuración. El fallo no reinicia los mecanismos ni registra comprensión.

**Revisar.** Se modifica el plan y se prueba otra vez. Las pistas se solicitan: primero describen el problema observable; después relacionan causas; una solución explícita se anuncia antes de revelarse. No hay ayuda automática por tiempo.

**Terminar.** La llegada se confirma cuando toda la huella de la figura está sobre galería fija y ya ha dejado atrás el borde derecho del marco. Su apoyo no puede depender de la pieza que va a levantar. Entonces se vuelve, toma el marco desde el lado alcanzado y se lo lleva. Retira el puente, no finge cerrar una segunda pared. Conserva un medio de crear otros pasos; la sombra continúa existiendo detrás. No fue necesario borrar lo inquietante para convertirlo en parte del camino.

## 7. Estados y recuperación

| Estado | Comportamiento definido |
| --- | --- |
| Portada | Preferencias, Nueva partida o Continuar. Ninguna solución automática. |
| Edición | Figura en inicio seguro; manipulación y previsualización. Probar solo usa valores confirmados. |
| Manipulación tentativa | Cancelar o una confirmación que invalida apoyos restaura la configuración completa previa. Cambiar área, perder foco o abrir otro panel cancela primero lo provisional. |
| Ensayo / pausa | Configuración bloqueada; pausa o cierre de Ayuda no reanuda automáticamente. Detener antes de llegar devuelve a inicio sin alterar el plan. |
| Resultado fallido | Consecuencia legible y vuelta a Edición; no pérdida de objetos. |
| Llegada confirmada | Se guarda el final antes de representar la recogida del marco. Recargar recupera el resultado final, no una figura a mitad de apoyo. |
| Final | Revisar restaura la configuración anterior al ensayo exitoso. Reiniciar pide confirmación y conserva preferencias. |

Deshacer cubre las últimas 20 operaciones de edición confirmadas. Conserva ajustes de acceso y disposición cómoda de las vistas; no guarda imágenes. Un ajuste inválido no consume historial. Revisar vuelve al plan anterior al cruce y permite repetirlo; el logro de haber terminado se conserva hasta una nueva partida.

El registro local es versionado: parámetros confirmados, posición/soporte del marco, historial acotado, preferencias, introducción atendida, plan previo al ensayo final y estado de terminación. Se valida la configuración completa y cada punto de historial antes de permitir restaurarlo. No se guardan arrastres, animaciones ni ensayos parciales. Reanudar un ensayo interrumpido vuelve a Edición con su configuración estable; un registro ilegible ofrece una nueva partida segura y nunca duplica objetos. En el final, el marco está sostenido por la mano de la figura y no aparece también como puente; Revisar recupera el único marco del plan anterior.

## 8. Comprobaciones que la ampliación exige

| ID | Evidencia necesaria, todavía no obtenida en producto |
| --- | --- |
| N01 | Mover la luz conserva orientación y escala; girar la plantilla cambia pendientes de la misma proyección. |
| N02 | Dos configuraciones distintas permiten un camino con margen y las configuraciones fallidas muestran problemas diferentes. |
| N03 | Sin un apoyo adicional no existe cruce completo en el modelo; el marco solo tampoco salva el espacio total. |
| N04 | La regla de apoyo desde arriba permite predecir el paso junto a montantes y se aplica a sombra, trazos y marco. |
| N05 | Los dos contactos del marco son visibles, permanentes y aceptados por los mismos criterios; no hay colocaciones aparentemente apoyadas rechazadas por una casilla oculta. |
| N06 | No hay salto, escalada ni colocación de una abertura baja que teletransporte a la galería alta. |
| N07 | La figura espera durante edición y no queda suspendida al cambiar una proyección; durante el ensayo la configuración no cambia. |
| N08 | Cancelar, deshacer, recargar y revisar conservan una sola pieza y un estado seguro. |
| N09 | Clics, teclado, silencio y movimiento reducido conservan decisiones y significado. |
| N10 | Personas sin explicación pueden distinguir pendiente incorrecta, falta de contacto y falta de longitud, y pueden reinterpretar el marco sin una solución mostrada. |
| N11 | Mover luz o plantilla después de apoyar el marco no permite confirmar levitación: rechazo completo, Deshacer y recarga recuperan configuraciones coherentes. |
| N12 | El cálculo y el recorrido real incluyen descenso de 20, huella y corrección horizontal total de 48. La llegada no se confirma mientras la figura siga sostenida por el marco. |

La revisión con agentes y los números no aprueban estas comprobaciones del producto. El primer recorrido provisional deberá ensayar primero la relación geométrica y la legibilidad de los materiales; después procede invertir en acabado. No se mantiene como válida la antigua batería V2 de gesto, Bandeja y dos traslados.
