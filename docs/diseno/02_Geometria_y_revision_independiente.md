# Geometría y revisión independiente · V3 · Cierre R1

## 1. Cómo se redujo el sesgo de la revisión

Los agentes de mecánicas y narrativa generaron dos familias nuevas. Un lector sin contexto previo inspeccionó un resumen de V2; ese resumen incluía su solución, por lo que sus anticipaciones **no se usan como prueba de que un jugador descubriría demasiado pronto el acertijo**. Su aportación fue preguntar por libertad de colocación, consecuencias y objetivo.

Después, un juez nuevo recibió tres bocetos identificados por letras, sin el historial ni la preferencia de los diseñadores. Comparó la versión anterior, hojas superpuestas y proyección material. Los diseñadores preferían las hojas; el juez prefirió la proyección y rechazó inflar el número de inferencias mediante controles enseñados. Esa discrepancia cambió la selección.

El juez también recomendó manipulación directa: si la planificación permanece intacta al retirar la mano grabada, no debe añadirse trabajo a cada ajuste para conservar aquella idea. V3 adopta esa recomendación.

El agente principal propuso reutilizar el marco como puente y calculó sus contactos. El mismo juez lo consideró una generalización defendible, pero detectó permanencia en el aire y montantes laterales. La solución seleccionada elimina levitación y aplica apoyo desde arriba de forma uniforme. El juez aprobó **acotadamente la coherencia**, exigiendo que ambas reglas se enseñen antes de necesitar el puente.

Estos agentes son modelos y lectores hipotéticos. No se presentan como participantes humanos impresionados, pruebas ciegas con usuarios ni estadísticas de preferencias. La comparación sin historial reduce una fuente de anclaje; no elimina todos los sesgos.

## 2. Opciones comparadas y decisión

| Opción | Mérito | Motivo de selección o descarte |
| --- | --- | --- |
| V2.2/C1: gesto y Bandeja | Identidad clara y alcance pequeño. | La secuencia conservaba una deducción central y ejecución posterior. Queda como antecedente, no base actual. |
| Dos hojas, abertura para ver/alcanzar/atravesar | Permitía planificación de profundidad y acceso corporal. | Añadía carga de explicación; ver y alcanzar estaban demasiado próximos para contarlos como ideas independientes. |
| Sombra material y fuente orientable | Forma y emplazamiento tienen causas separadas y consecuencias comparables. | Base seleccionada, tras encontrar una geometría real y retirar el manejo indirecto obligatorio. |
| Sombra más marco como apoyo | Generaliza la regla material a un objeto entendido como abertura. | Adoptada con contactos físicos y paso lateral uniformes; no con una nueva habilidad o modo de puente. |

## 3. Modelo de proyección

Coordenadas con **y hacia arriba**; son del modelo, no posiciones de interfaz. Plantilla y pantalla están en planos paralelos de profundidad fija, con factor de proyección 2.

Pivote C₀ = (400,100). Vértices locales: v₀=(0,0), v₁=(225,90), v₂=(375,90). Lámpara L=(Lₓ,220), con riel Lₓ entre 500 y 740. El pivote gira entre 0° y 90°.

Para cada vértice:

**Sᵢ = 2(C₀ + Rθ vᵢ) − L.**

La posición de L traslada todos los puntos por igual. No escala ni inclina el perfil. El giro Rθ orienta la plantilla. La proyección se deriva de estos parámetros; no de seleccionar una ilustración considerada correcta.

Suelo inicial: y=0 hasta x=220. Galería real: y=160 desde x=1120. La figura no salta; sigue perfiles superiores con pendientes de hasta 30° y escalones ascendentes o descendentes de hasta 20. Para la cota conservadora se concede un alcance horizontal de hasta 48 en cada contacto, incluida huella y cualquier corrección: no son márgenes sumables.

## 4. Dos soluciones y fallos distintos

Con θ=0, los vértices son:

**(800−Lₓ,−20), (1250−Lₓ,160), (1550−Lₓ,160).**

La rampa cruza y=0 en **x=850−Lₓ**. La meseta está entre **1250−Lₓ y 1550−Lₓ**.

Marco: ancho 340, alto 180, borde de espesor 10. Sus extremos inferiores requieren al menos 20 de apoyo plano a la misma altura. Posarlo sobre y=160 deja su superficie superior de paso en y=170: un escalón de 10, dentro del permitido. La altura interior de 160 permite un cuerpo de 100; los montantes permiten paso lateral por la regla general. La galería se extiende más allá del marco para que la figura deje de apoyarse en él antes de recogerlo.

| Configuración | Resultado calculado |
| --- | --- |
| θ=90°, Lₓ=500 | Sombra (300,−20), (120,430), (120,730). Perfil alto que no ofrece recorrido a la galería. Mover luz conserva esa orientación. |
| θ=0°, Lₓ=500 | La sombra comienza en x=300 y encuentra y=0 en 350. Ni siquiera el alcance horizontal concedido de 48 conecta desde el borde 220: queda una separación inicial de 80. |
| θ=0°, Lₓ=650, marco centrado en x=1010 | Rampa toca suelo en 200; meseta 600..900. Marco 840..1180: 60 de contacto con sombra y 60 con galería. Camino completo. |
| θ=0°, Lₓ=700, marco centrado en x=985 | Rampa toca suelo en 150; meseta 550..850. Marco 815..1155: 35 de contacto con cada apoyo. Otra configuración completa. |
| θ=0°, Lₓ=740, marco centrado en x=970 | Meseta 510..810. Marco 800..1140 tiene solo 10 de contacto izquierdo: falta apoyo suficiente, aunque la pendiente sirva. |

Hay margen real, no una posición única: con Lₓ=650 el centro del marco puede estar entre 970 y 1050 conservando ambos contactos mínimos; con Lₓ=700, entre 970 y 1000. Mover luz y colocar marco se relacionan: no son tres valores independientes que simplemente deben activarse una vez.

## 5. Por qué no basta un único elemento

La cota anterior de 950 se retira: suponía contacto exacto con y=0 y no cubría el descenso permitido. La prueba R1 incluye incluso un alcance horizontal favorable a un posible atajo.

Para cualquier θ entre 0° y 90°, las diferencias horizontales entre vértices son 450·cosθ−180·sinθ, 750·cosθ−180·sinθ y 300·cosθ. Sus valores absolutos no superan 750. Por tanto, la anchura horizontal total de la sombra es como máximo 750, independientemente de su posición.

Concediendo 48 de alcance para enlazar desde el suelo que acaba en 220, algún punto de la sombra debe estar en x≤268. Su extremo derecho no puede superar **268+750=1018**. Concediendo otros 48 para llegar al destino, el alcance total máximo sería **1066**, todavía menor que **1120**. Queda un margen de 54 incluso con esas dos concesiones. El escalón vertical de 20 no amplía esa anchura horizontal. Esta cota evita asumir un avatar puntual, aunque debe comprobarse que la implementación no añada otra tolerancia fuera del total 48.

El marco solo tiene ancho 340, insuficiente para unir directamente el borde inicial 220 con la galería 1120. Incluso concediendo 48 a cada extremo, 340+96 es menor que la separación 900. Para una colocación estable necesita apoyos planos a la misma altura: no se puede mantener flotando un extremo sobre una rampa ni usar un único contacto puntual como si fuera una base ancha. La sombra proporciona el apoyo intermedio que hace útil al marco.

La orientación incorrecta, el emplazamiento que no conecta con el inicio y el marco sin contacto suficiente producen fallos diferentes. El plan combina esas condiciones. No se atribuye una deducción adicional a dejar quieta la luz mientras el ensayo bloquea los controles.

Los vértices, intersecciones y solapes anteriores se comprobaron numéricamente en esta revisión. La cota de anchura se contrastó con ingeniería de requisitos. No se ha creado código del producto, una simulación jugable o arte final.

### Regresión encontrada y corrección

En la geometría anterior, el suelo acababa en 250 y la galería empezaba en 980. Con θ=0 y Lₓ=550 se obtenía (250,−20), (700,160), (1000,160): bajar 20 permitía recorrer la sombra sin marco. Otro ejemplo, Lₓ=560, dejaba el perfil a y=−16 junto al borde 250. Dos revisores detectaron este problema independientemente. Una primera corrección puntual seguía siendo vulnerable a la huella; por eso R1 usa una cota conservadora en ambos extremos y no solo cambia el centro del avatar.

También faltaba tratar un marco apoyado cuando se modifica su sombra. Se adopta una transacción completa: una confirmación que invalida cualquiera de sus apoyos restaura el estado anterior de todos los mecanismos. La previsualización inválida no se guarda ni se ensaya. Se puede retirar antes el marco a su anclaje o a un suelo amplio. No se añade caída, levitación o traslado automático a otro soporte.

## 6. Condiciones de justicia que exigió el juez

- El marco debe verse entero y material antes de reinterpretarlo; no parecer una máscara que adquiere peso al final.
- El apoyo desde arriba y el paso lateral deben poder predecirse a partir de una situación temprana. Si se buscan saltos o se cree que el marco hace una excepción, hay que revisar la enseñanza.
- Los patines, contactos y anchura del marco deben coincidir con lo que acepta el modelo. Si una posición aparentemente bien apoyada falla, no se corrige añadiendo una explicación: se revisan representación y tolerancia.
- El objetivo alto permanece fijo. Una abertura baja no transporta a la figura al refugio; no se oculta ese supuesto para sorprender después.
- El personaje espera durante la construcción y los mecanismos se bloquean en el ensayo. No se permite crear un puente y retirarlo bajo sus pies para producir una caída.

## 7. Qué falta comprobar con una versión provisional

La primera comprobación debe usar controles directos y formas simples, con los contactos y el paso del cuerpo reales. Debe confirmar la construcción matemática con grosor, huella corporal, límites de colocación y colisiones. Después procede observar a personas sin explicar el marco-puente.

Se preguntará por predicciones y motivos después de sus intentos, separando: relación fuente/proyección, diferencia forma/posición, generalización del marco, comodidad y satisfacción. Un agente que describe el resultado correcto no sustituye ninguna de esas observaciones.

No se dará por excelente por añadir parámetros. El criterio es que se pueda anticipar qué falla, elegir entre correcciones y descubrir la aplicación material del marco con suficiente margen. Si solo se arrastra hasta que algo acepta, la ampliación no habrá cumplido su objetivo.

## 8. Documentación consultada

[Ron Gilbert, Puzzle Dependency Charts](https://www.grumpygamer.com/puzzle_dependency_charts/), 2014, consultado el 30 de octubre de 2026: distinguir dependencias reales de una sucesión de pasos narrados y comprobar qué condiciones se combinan. Nuestra aplicación es el contacto de origen, el perfil orientado y el apoyo final.

La [presentación oficial de Patrick’s Parabox](https://www.patricksparabox.com/), consultada el 30 de octubre de 2026, ilustra un sistema desarrollado mediante ideas diferentes derivadas de reglas relacionadas. Se toma ese objetivo de diseño; no se copia su sistema recursivo ni se presenta su escala como alcance para este proyecto.

No se atribuye a esas fuentes la propuesta del marco-puente ni una garantía de premio. No se afirma haber leído la charla de GDC cuya descarga no estuvo disponible.
