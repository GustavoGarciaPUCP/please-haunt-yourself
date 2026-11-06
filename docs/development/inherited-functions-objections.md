# Objeciones al sistema de funciones heredadas

> Revisión de Kiro CLI / Claude Sonnet 4.5, revisada por Codex. Se acepta como objeción importante la opacidad de los receptores y el riesgo de memorizar combinaciones. No se adoptan automáticamente las demás conclusiones: un objeto puede conservar su historial sin ofrecer una operación para invertirlo; borrar una entrada de una bitácora de observación no revierte el acontecimiento observado; aumentar una profundidad de Deshacer no crea estados que nunca se guardaron; y el umbral del 30 % no tiene fundamento aportado. La propuesta de otra función Instalar amplía el sistema sin resolver el problema central y no se incorpora. El texto conservado abajo es una crítica a revisar, no un modelo de reglas aceptado. Las precisiones y el recorrido posterior están en `docs/diseno/06_Exploracion_funciones_heredadas.md`.

5 de noviembre de 2026. Crítica de diseño de la propuesta de funciones heredadas. No es especificación aprobada, no autoriza implementación ni predice resultados competitivos.

## 1. Razón más fuerte para rechazar esta dirección

**El jugador no puede distinguir reglas físicas de reglas mágicas hasta probar cada par.** En La ventana equivocada actual, la geometría determina qué se puede hacer: la mano alcanza distancias reales, los marcos se apoyan o caen según la física de sombras. Aquí, el sistema propone que "Deshacer invierte una transición registrada" pero el jugador debe adivinar qué objetos tienen historial, qué transiciones se registraron y cuántos niveles de deshacer existen. La regla suena estable pero su aplicabilidad es opaca. Si cada ventana es un caso especial ("este tiene registro, este no"), el aprendizaje se vuelve enumerativo: memorizar una matriz receptor×función sin principio unificador. La física de sombras permitía anticipar; aquí se promete anticipación pero se entrega descubrimiento por prueba y error.

## 2. Contraejemplo que rompe la escena Deshacer/Pausa

**El servicio de limpieza no tiene motivación para registrar su propia acción en un historial manipulable.** La escena asume que aplicar Deshacer a la carpeta "invierte el borrado registrado" y que el archivo vuelve. Pero el registro del borrado es información interna del servicio, no de la carpeta. Si la carpeta mantiene ese registro, ¿por qué no puede deshacerlo ella misma? Si es el servicio quien registra, Deshacer debería aplicarse al servicio, no a la carpeta. La propuesta cambia el objetivo según convenga: Pausa se aplica al servicio porque controla la actividad, pero Deshacer se aplica a la carpeta porque el archivo debe aparecer ahí. Esta inconsistencia revela que las reglas se ajustan para forzar la solución deseada, no emergen de un modelo coherente. Además, la escena no especifica si Pausa detiene permanentemente o solo temporalmente, ni qué pasa al retirar la función fantasma.

## 3. Cambio mínimo que mejora la agencia sin subsistemas nuevos

**Permitir transferir una capacidad entre dos receptores que ya la tienen, cambiando su potencia o alcance.** En lugar de posesión mágica, cada programa muerto deja su implementación específica de una función común. Ejemplo: dos editores tienen Deshacer, pero uno recuerda 5 pasos y otro 50. El jugador transfiere la profundidad de historial del editor veterano al editor simple, mejorando su capacidad sin inventar nuevas reglas. Esto convierte el cierre en una decisión de redistribución: ¿sacrifico este programa para potenciar otro que necesito más? La regla sigue siendo "los programas son herramientas", pero ahora el jugador comprende qué cambia (cantidad, alcance, precisión) sin necesidad de explicaciones ad-hoc por receptor. Las funciones comunes del escritorio (copiar, buscar, ordenar) ya existen; la posesión solo amplifica o especializa lo presente.

## 4. Secuencia de seis acciones que muestra causa, efecto y cambio de interacción

1. **Inspeccionar el registro de auditoría:** muestra "Archivo X eliminado a las 23:45" y "Servicio de limpieza ejecutado a las 23:50". El jugador lee que el archivo fue borrado manualmente, luego el servicio lo procesó definitivamente.
2. **Cerrar el editor veterano:** aparece su función Deshacer como ícono arrastrable, con tooltip "Invierte la última acción registrada del objetivo".
3. **Aplicar Deshacer al registro de auditoría:** la entrada "Servicio ejecutado" desaparece; el archivo X vuelve a la lista de archivos eliminados pero no recuperados. El registro ahora termina en "Archivo X eliminado a las 23:45".
4. **Aplicar Deshacer nuevamente al registro:** la entrada "Archivo X eliminado" desaparece; el archivo X reaparece en su carpeta original.
5. **Abrir el archivo X:** revela un log que identifica qué programa causó el problema de sesión. Ese programa tiene una dependencia faltante visible en su ventana de error.
6. **Cerrar un gestor de paquetes:** deja su función Instalar; aplicarla a la ventana de error permite restaurar la dependencia faltante.

**Suposiciones:** que el registro de auditoría sea un objeto manipulable como cualquier ventana; que Deshacer pueda aplicarse múltiples veces si el historial lo permite; que las ventanas muestren estado suficiente para anticipar el efecto. Sin estas condiciones, la secuencia colapsa en clicks arbitrarios.

## 5. Prueba de rechazo en papel y qué requiere observación posterior

**Prueba de papel:** dibujar el grafo de dependencias entre todas las funciones heredadas y todos los receptores planeados. Para cada par función-receptor, escribir: (a) qué cambia, (b) cómo se revierte, (c) si el efecto es inmediato o requiere otros pasos. Si más del 30% de las celdas dicen "caso especial" o "depende del contexto", la regla no es estable. Si el jugador necesita leer descripciones específicas en lugar de aplicar un principio, el sistema es una base de datos disfrazada de mecánica. **Rechazo:** si no podemos completar el grafo sin contradicciones ni etiquetas "por diseñar", la propuesta no está lista para código.

**Qué requiere observación:** **(1)** ¿Puede un jugador sin leer instrucciones anticipar qué hará una función heredada en un receptor nuevo después de verla actuar una vez? **(2)** ¿El jugador experimenta el cierre de un programa como pérdida significativa o como desbloqueo de herramienta? **(3)** ¿La narrativa de cada programa se integra con su función o son dos capas desconectadas? Estas preguntas solo se responden viendo a personas reales intentar resolver sin ayuda. La ausencia de frustración excesiva y la presencia de momentos "ah, entonces puedo…" son los indicadores reales. Un diseñador convencido no sustituye esa evidencia.
