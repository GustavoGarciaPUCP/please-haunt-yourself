# Revisión crítica: programas muertos

> Generada por Kiro CLI / Claude Sonnet 4.5 y revisada por Codex. Es una revisión documental de una propuesta; no incluye pruebas del juego, observaciones humanas ni una certificación de originalidad. Codex añade dos límites: `SIGTERM` solo permite una despedida si el programa tiene un manejador que la implementa; su acción predeterminada no garantiza guardado ni cierre ordenado. Además, perder una pista por cierre forzado no puede bloquear el avance: hay que diseñar recuperación o evidencia alternativa. No se acepta la revisión como autorización automática para implementar.

5 de noviembre de 2026. Revisión independiente de la propuesta en `05_Programas_muertos_propuesta.md` para identificar fortalezas, riesgos concretos de fracaso y decisiones de diseño pendientes antes de cualquier implementación.

## 1. Parte más defendible y tres riesgos de fracaso

**Fortaleza principal:** el vínculo entre la personalidad de cada programa y su comportamiento técnico específico —una consola con salida pendiente, un servicio reiniciado, una entrada zombi— proporciona una estructura causal clara que diferencia los casos más allá del diálogo superficial. Esta relación observable puede hacer que la investigación se sienta como resolver el problema técnico subyacente en lugar de hacer clic en una respuesta entregada.

**Riesgo 1 – Investigación degenerada en búsqueda de botones:** si las herramientas de diagnóstico no exponen las pistas de forma comprensible, o si las consecuencias de cada intervención no refuerzan visiblemente qué cambió, el jugador probará opciones al azar hasta que una funcione. La diferencia entre «permitir que termine» y «cambiar supervisor» y «recoger salida del padre» se pierde si todas son etiquetas en un menú sin contexto previo.

**Riesgo 2 – Personalidades reemplazadas por texto de sabor genérico:** una frase inicial memorable («No me cierres, todavía falta una línea») no sostiene el interés si la despedida y los mensajes intermedios son neutros o resuelven su problema fuera de pantalla. Si la consola no muestra su última línea preservada ni explica qué era esa salida pendiente, su cierre se convierte en un acertijo técnico sin peso narrativo.

**Riesgo 3 – Ausencia de relación entre casos:** tres reglas independientes se perciben como tres ejercicios de tutorial, no como una sesión coherente de cierre. Si el registro del supervisor que reinicia al segundo programa no menciona también salidas pendientes del primero o estados zombi del tercero, pierden su función de pistas cruzadas y se convierten en una colección lineal sin cohesión.

## 2. Crítica de los tres casos propuestos

**La consola pendiente:** requiere descubrir qué falta (herramienta de inspección), reconocer que esa salida debe completarse o guardarse (diagnóstico), y ejecutar la intervención apropiada (acción diferente de «cerrar»). La evidencia antes de actuar es el estado interno de la consola —buffer de salida incompleto, último comando en espera— visible mediante inspección del proceso. Si esa información no está disponible o es críptica, el diagnóstico se adivina. **Decisión requerida:** qué salvar o permitir terminar, basada en evidencia específica.

**El programa que regresa:** cierre inicial, reaparición observada con nuevo PID, consulta al registro de eventos que muestra el supervisor responsable, intervención sobre el servicio de reinicio. La evidencia es el historial de cierres múltiples y la configuración del supervisor. **Decisión requerida:** cambiar el supervisor o detener su regla de reinicio, diferente de repetir el cierre del programa hijo.

**El registro que no se va:** aparece en lista pero no responde, mensaje fechado antes del cierre, estado zombi identificable. La evidencia es la falta de actividad del proceso y su relación con un padre vivo. **Decisión requerida:** invocar recogida desde el padre, no enviar nueva señal de terminación.

**¿Son tres decisiones distintas?** Sí, si cada una requiere herramientas o interpretaciones diferentes. No, si el ayudante simplemente entrega tres botones etiquetados con la respuesta correcta tras una inspección superficial. La distinción depende de cuánta información previa obtiene el jugador y qué tan obvio es el siguiente paso. Si «Permitir terminar», «Detener supervisor» y «Recoger zombi» aparecen como opciones ofrecidas después de un clic genérico de «Diagnóstico», colapsan en hacer clic en la sugerencia del ayudante tres veces.

## 3. Primer encuentro mínimo que puede rechazar el concepto

**Caso de prueba:** el programa que regresa.

**Antes:** el escritorio ficticio muestra una aplicación activa. Un panel lateral o barra de tareas indica su presencia. El ayudante está disponible pero no intrusivo.

**Acción del jugador:**
1. Cierra la aplicación mediante su botón de cierre o una acción explícita de terminación.
2. Observa que la aplicación reaparece después de unos segundos, con una voz o mensaje breve: «Me dijeron que nunca me detuviera».
3. Consulta el registro de eventos (herramienta disponible desde el inicio o señalada por el ayudante tras la reaparición).
4. Encuentra entradas que muestran: proceso terminado, supervisor lo reinicia, nueva instancia con otro PID.
5. Accede a la configuración del supervisor (panel de servicios o equivalente).
6. Cambia la regla de reinicio automático o detiene el servicio.
7. Cierra la aplicación nuevamente.

**Después:** la aplicación no reaparece. Su despedida incluye una variación que reconoce el fin de la instrucción de reinicio: «Ahora puedo descansar». El registro conserva evidencia del cambio.

**Criterio de rechazo:** si un observador externo no puede explicar qué causaba la reaparición y qué cambió tras su intervención, o si el proceso se siente como probar botones hasta eliminar el síntoma sin diagnóstico, el concepto falla. Si la personalidad del programa se reduce a dos líneas idénticas independientes de la historia de reinicios, tampoco sostiene interés.

## 4. Consecuencia significativa: force-kill versus cierre ordenado

**Force-kill (SIGKILL o equivalente simulado):** el proceso termina inmediatamente sin ejecutar despedida propia. La última línea, el mensaje de cierre o la guardia de estado no suceden. La consecuencia visible es la **ausencia** de esa voz final o registro preservado. El jugador ve un cierre abrupto y pierde información narrativa o de diagnóstico que ese programa habría entregado.

**Cierre ordenado (SIGTERM o petición controlada):** el proceso ejecuta su secuencia de cierre, guarda estado si corresponde, entrega su último mensaje y termina limpiamente. La consecuencia visible es la **presencia** de despedida, salida preservada en registro, o dato recuperado que informa el siguiente caso.

**Ejemplo concreto sin moral ni puntaje:** la consola pendiente bajo cierre ordenado completa su última línea de salida y esa línea queda visible en el registro de la sesión, sirviendo como pista para identificar el supervisor del segundo caso. Bajo force-kill, la salida se pierde, el registro queda incompleto y el jugador carece de esa pista cruzada. La diferencia no es «bueno» versus «malo», sino información disponible versus perdida, afectando la navegabilidad de la sesión y la cohesión narrativa entre casos.

## 5. Decisiones de diseño pendientes

1. **Herramientas de diagnóstico específicas:** qué información expone cada una (inspector de procesos, registro de eventos, visor de configuración de servicios, árbol de relaciones padre-hijo) y en qué formato comprensible para público no técnico.

2. **Secuencia de disponibilidad:** ¿las tres apariciones están presentes desde el inicio o se desbloquean al resolver la anterior? ¿Cómo se señala la relación narrativa entre casos si son simultáneas?

3. **Rol preciso del ayudante:** explica herramientas genéricas, señala dónde buscar evidencia, o entrega diagnósticos parciales tras inspección. Fijar límite entre orientación útil y solución entregada.

4. **Consecuencias de intervención incorrecta o prematura:** si el jugador intenta force-kill antes de investigar, ¿pierde pistas recuperables? ¿Cómo se señala esa pérdida sin bloquear progreso? ¿Existe recuperación dentro de la sesión?

5. **Contenido y tono de las despedidas:** líneas específicas, animaciones breves, cambios de estado del escritorio. Deben reflejar qué intervención se ejecutó y qué estado quedó preservado.

6. **Representación de la convención técnica:** ¿sistema ficticio con reglas propias consistentes, o emulación de Unix/Windows con comandos reconocibles? Elegir una antes de diseñar el terminal opcional.

7. **Cierre de la sesión completa:** qué determina que el apagado está listo, qué información resume el registro final, qué reconocimiento recibe el jugador de su trabajo sin convertirlo en puntaje o métrica de eficiencia.

8. **Validación mediante observación externa:** método concreto para confirmar que un jugador sin conocimiento previo de la solución puede diagnosticar causas, no solo probar opciones. Sin esto, el concepto no puede considerarse validado.

**Conclusión:** la propuesta tiene una estructura causal defendible que la diferencia de colecciones genéricas de clic-y-despedida, pero su éxito depende completamente de la implementación de herramientas de diagnóstico comprensibles, consecuencias visibles de cada intervención y cohesión narrativa entre casos. Los tres riesgos de fracaso son concretos y probables. El primer encuentro mínimo propuesto puede rechazar el concepto antes de invertir en la experiencia completa. Las ocho decisiones de diseño pendientes son obligatorias antes de cualquier implementación. El concepto no está listo para desarrollo; requiere diseño detallado de herramientas y prueba de la interacción básica.
