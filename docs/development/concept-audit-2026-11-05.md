# Auditoría de concepto · 5 de noviembre 2026

> **Estado: borrador de Kiro revisado; recomendación rechazada.** Codex añadió esta advertencia después de contrastar el texto. No es una nueva especificación ni acredita originalidad, viabilidad o calidad de experiencia.
>
> Errores y límites detectados: (1) la afirmación de ausencia de precedentes para el laboratorio fotográfico está contradicha por [Darkroom](https://store.steampowered.com/app/3832600/) y [Scotopic](https://rainzea.itch.io/scotopic); (2) la ficha de [In My Shadow](https://store.steampowered.com/app/1406200/In_My_Shadow/?curator_clanid=9170052&l=english) indica estreno en 2021; (3) la ficha consultada de [Seance](https://devpost.com/software/seance) describe preguntas de opción múltiple y no sustenta la afirmación de decisiones morales; (4) el ejemplo de 60 segundos suma 85 segundos; (5) las estimaciones de horas/semanas, el realismo químico y las afirmaciones de mejor probabilidad competitiva no están validados. Se conserva el borrador para dejar visible qué recomendó Kiro y por qué no se aceptó.
>
> Después de esta auditoría, el participante autorizó cambiar también la idea central y propuso un escritorio con programas muertos, personalidades y distintas formas de darles descanso. La propuesta activa, todavía por validar, está en `docs/diseno/05_Programas_muertos_propuesta.md`.

## 1. Veredicto sobre el prototipo actual

**REDISEÑO RECOMENDADO.** El prototipo técnico funciona; el concepto de juego es débil.

### Separando ingeniería de concepto

La implementación TypeScript/Vite es sólida: ecuación de proyección verificada, transacciones atómicas, recuperación de estados, controles equivalentes mouse/teclado, sin dependencias excesivas. Las pruebas documentan geometría y propiedades físicas. Esta ingeniería es reutilizable.

### Dónde falla el concepto

**Objetivo conocido ejecutado genéricamente.** "Cruzar un espacio usando sombras manipuladas" es exactamente *In My Shadow* (2020), un juego comercial premiado que ya entrega múltiples soluciones, narrativa emocional y estética pulida. Nuestra versión de un nivel no supera esa referencia ni ofrece un giro memorable. El mecanismo de proyección está correctamente implementado, pero la experiencia es "una versión más simple de algo que ya existe bien hecho".

**Identidad Halloween inexistente.** La sombra inquietante mencionada en la especificación no se materializa en juego. No hay atmósfera perturbadora, momento de sorpresa, subversión temática ni transformación narrativa. Podría ser un tutorial de física escolar. El marco negro y la figura genérica no construyen presencia emocional. La observación «Hay salida. Falta camino» es un acertijo neutro, no una situación de Halloween.

**Diferenciador ausente.** La especificación promete "reinterpretar el marco" pero en práctica es "usar un objeto como puente después de usar sombras como rampa". La secuencia de comprensión (causa, forma/posición, reinterpretación) describe razonamiento normal de puzzle, no innovación. El criterio de competencia exige diferenciación real.

**Debilidad frente a ganadores 2025.** *Seance* ofreció 19 países con historias folklóricas específicas y decisiones morales; *SpookBnB* transformó una página web ordinaria en horror interactivo con fragmentos narrativos enlazados. Ambos tienen identidad fuerte, atmósfera sostenida y presentación coherente. Nuestro cruce de sombras no alcanza esa densidad conceptual ni impacto memorable.

### Reconocimiento sin excusas

El trabajo invertido no justifica defender un concepto débil. La geometría correcta y las reglas materiales claras son logros de ingeniería, no suficiencia de juego. Un solo nivel de cruza-el-hueco carece del peso para competir en un concurso que valora igualmente impacto, innovación, diseño como producto completo, implementación técnica y presentación. Mantener el prototipo actual sería presentar trabajo honesto pero conceptualmente ordinario.

---

## 2. Tres direcciones alternativas

### A. **El Revelado** — Fotografía analógica oscura como puzzle temporal

**Situación:** Un cuarto oscuro fotográfico donde el jugador es un técnico de laboratorio forense procesando evidencia de una escena perturbadora. Las imágenes se revelan gradualmente en química real (desarrollador, paro, fijador) con tiempos precisos. Exponer demasiado tiempo quema detalles; muy poco deja la imagen ilegible.

**Qué hace el jugador:** Arrastra papel fotográfico entre tres bandejas químicas con temporizador visible. Controla una linterna roja (segura) y una luz blanca destructiva (para examinar o arruinar). Debe revelar cuatro fotografías en secuencia; cada una contiene un fragmento de coordenadas o un patrón que desbloquea la siguiente. La química no se regenera: cantidad finita de líquido, contaminación progresiva si arrastra mal.

**60 segundos:** Sumerge el primer papel en desarrollador, cuenta 45 segundos mientras la imagen fantasma emerge (CSS filter + opacity animation), pasa a paro 10 segundos, luego fijador 30 segundos. La imagen es una mano presionando un cristal desde dentro. En la esquina hay números: "03". Debe recordarlos o anotarlos mentalmente antes de procesar la siguiente foto, que mostrará "14" en un contexto más perturbador (rostro distorsionado). Mal timing hace la imagen demasiado clara (detalles excesivos perturban) o demasiado oscura (pierde el código).

**Diferenciador propuesto:** Mecánica de timing químico real como puzzle narrativo progresivo. No es gestión de recursos convencional porque el "error" no es game over sino transformación visual perturbadora. Las imágenes cambian de inquietante a insoportable si se sobreexponen; el jugador debe detenerse antes de ver demasiado. Tensión entre completar el puzzle y limitar exposición emocional.

**Concepto/riesgo más cercano:** *Please, Touch The Artwork* (puzzles en pinturas), *Papers Please* (mecánica de documento iterativo). Riesgo: que el timing se sienta como quick-time events genéricos sin peso narrativo, o que la narrativa de horror no justifique la restricción mecánica.

**Factibilidad solitaria:** Alta. DOM + CSS animations + timers simples + canvas para efectos de imagen. Cuatro fotografías con revelar progresivo es alcanzable en una semana intensiva. No requiere física compleja. SVG filters para efectos químicos, audio ambiente opcional.

**Test de rechazo barato:** Prototipo una foto en 3 horas: arrastrar papel entre tres divs, temporizador visible, imagen que aparece gradualmente con blur-to-sharp. Si la interacción se siente como "esperar una barra de progreso", el concepto no funciona. Si genera tensión al ver la imagen emerger y decidir cuándo detener, puede funcionar. Mostrar a alguien sin contexto: ¿sienten urgencia o aburrimiento?

---

### B. **La Máscara Incompleta** — Ensamblaje de papel recortado con proporciones malditas

**Situación:** El jugador hereda la mesa de trabajo de un artesano de máscaras desaparecido. Hay plantillas de papel parciales y un espejo antiguo. Las instrucciones están incompletas: "Ensamble la máscara siguiendo la proporción áurea inversa". A medida que coloca piezas correctamente, el reflejo en el espejo cambia. No está construyendo una máscara decorativa: está reconstruyendo el rostro de algo.

**Qué hace el jugador:** Arrastra piezas de papel (frente, mejillas, mentón, ojos, boca) sobre un maniquí SVG. Cada pieza tiene puntos de anclaje; deben conectar sin solapamiento ni huecos. Pero las proporciones "correctas" según las marcas del artesano están deliberadamente distorsionadas: ojos demasiado separados, boca desplazada. Conforme ensambla, el espejo al lado muestra el rostro completo, y no es humano. Hay siete configuraciones trampa que parecen correctas geométricamente pero producen reflejos perturbadores parciales. Solo una configuración específica termina el ritual/puzzle.

**60 segundos:** Coloca la pieza de la frente, encaja en el maniquí con snap magnético. El espejo muestra una frente alta, aún sin rasgos. Prueba colocar los ojos a distancia normal: encajan, pero el espejo muestra cuencas vacías oscilando. Deshacer. Separa los ojos al máximo según las marcas: ahora el reflejo muestra ojos que siguen al cursor. Coloca mejillas, pero asimétricas según el diagrama críptico. El reflejo sonríe de medio lado. Quedan nariz y boca, pero las instrucciones están quemadas parcialmente.

**Diferenciador propuesto:** Estética de papel recortado artesanal con reglas de ensamblaje contraintuitivas. La tensión viene de que las proporciones "correctas" según el puzzle son anatómicamente incorrectas, generando inquietud (uncanny valley deliberado). El espejo como feedback inmediato visual-emocional en lugar de indicador de "correcto/incorrecto". La máscara terminada es un objeto maldito que el jugador ensambla sabiendo que no debería.

**Concepto/riesgo más cercano:** *Gorogoa* (puzzles de ensamblaje de paneles ilustrados), *The Room* (objetos mecánicos manipulables). Riesgo: que se reduzca a "encontrar la configuración correcta entre variantes" sin carga emocional, o que el uncanny valley falle sin animación sofisticada.

**Factibilidad solitaria:** Media-alta. SVG para piezas, drag-and-drop con snap points, detección de configuración completa. El espejo puede ser canvas con distorsiones CSS o filtros SVG. Siete configuraciones trampa más una correcta es contenido acotado. El mayor desafío es arte: las piezas deben ser inquietantes pero legibles, y el reflejo debe cambiar de manera significativa. Requiere habilidad visual o colaboración con ilustrador.

**Test de rechazo barato:** Tres piezas (frente, ojos, boca) en una hora. Drag-and-drop con snap, feedback visual simple (cambio de color o texto). Si la mecánica de ensamblaje se siente satisfactoria y las proporciones incorrectas son evidentes visualmente, el concepto tiene base. Si el jugador no percibe la distorsión sin texto explicativo, el uncanny valley no funciona y el concepto debe descartarse.

---

### C. **El Teatro de Sombras Maldito** — Narrativa de siluetas con control de tiempo

**Situación:** El jugador opera un teatro de sombras de papel para una audiencia invisible. Tiene guion de una historia de Halloween (niño perdido en bosque, encuentra casa, algo sale mal) pero las siluetas y la lámpara están poseídas. Si ilumina al niño demasiado tiempo, se retrasa. Si ilumina la casa demasiado pronto, la historia se rompe. Si ilumina al monstruo antes de tiempo, la obra falla. Debe controlar lámpara y siluetas en tiempo real para contar la historia correctamente mientras los objetos intentan moverse solos.

**Qué hace el jugador:** Controla una lámpara que se desliza horizontalmente (iluminando diferentes siluetas recortadas en el escenario) y puede avanzar o retroceder un carrusel de 6-8 siluetas de papel. Las siluetas están en una cinta transportadora lenta pero automática. El guion aparece en pantalla como subtítulos que avanzan en tiempo real ("El niño camina hacia la oscuridad"). Debe iluminar la silueta correcta justo cuando el narrador la menciona. Iluminar mal genera disonancia: la audiencia invisible murmura, la lámpara parpadea, la siguiente escena se complica (silueta equivocada aparece antes).

**60 segundos:** Narrador: "Érase una vez un niño que se perdió en el bosque". El jugador desliza la lámpara para iluminar silueta del niño caminando. Check. "El viento soplaba entre los árboles". Debe cambiar el carrusel a silueta de árboles y enfocarla. Lo hace tarde: la audiencia invisible ríe nerviosamente, el guion se acelera. "Vio una casa al fondo". Casa ya está entrando al escenario porque el carrusel siguió moviéndose, debe enfocarla rápido. "Se acercó a la puerta". ¿Iluminar puerta o niño acercándose? Ambiguo. Elige puerta: el niño-silueta ahora está fuera de foco, la audiencia susurra inquieta. "La puerta se abrió sola". ¿Cambiar a silueta de puerta abierta o mantener cerrada? Debe avanzar el carrusel pero la lámpara está mal posicionada...

**Diferenciador propuesto:** Narrativa dirigida en tiempo real con control simultáneo espacial (lámpara) y secuencial (carrusel de siluetas). La posesión se manifiesta como física incontrolable: objetos que se mueven solos fuerzan reacción rápida. Tensión entre contar historia correctamente (puzzle lógico) y compensar lo impredecible (habilidad). El final "correcto" puede ser inquietante pero completo; fallos generan finales rotos o perturbadores alternativos. Mantiene estética de teatro de papel pero con interacción urgente en lugar de puzzle estático.

**Concepto/riesgo más cercano:** *Déjà Vu* (juegos de sincronización narrativa), *Keep Talking and Nobody Explodes* (instrucciones versus tiempo). Riesgo: que el timing se sienta frustrante en lugar de tenso, o que la narrativa sea demasiado corta para justificar la mecánica. También riesgo de ser "Guitar Hero pero con sombras" si no hay variación en respuestas.

**Factibilidad solitaria:** Media. Requiere script de narrativa bien escrito (2-3 minutos de "obra"), animación continua de carrusel + lámpara, detección de sincronización luz/silueta/texto, feedback de audiencia. 8 siluetas con variantes (puerta cerrada/abierta, niño parado/caminando, monstruo oculto/revelado). Técnicamente posible en una semana pero el diseño narrativo y tuning de timing son complejos. La rejugabilidad es baja si la historia es siempre igual.

**Test de rechazo barato:** Una escena de 20 segundos: tres siluetas en carrusel automático, lámpara controlable, tres líneas de narración. Si la sincronización manual genera tensión y los errores se perciben como consecuencia narrativa (no solo penalización numérica), el concepto funciona. Si el jugador ignora el texto y solo sigue indicadores visuales, la narrativa es irrelevante y el concepto falla.

---

## 3. Recomendación provisional

**Recomiendo provisionalmente El Revelado (opción A)** por cuatro razones:

1. **Diferenciación real:** La mecánica de timing químico analógico como puzzle narrativo progresivo no tiene precedente directo en Kiroween ni en puzzles web comerciales. La tensión entre completar el puzzle (exponer correctamente) y autolimitarse (no sobreexponer) es estructuralmente distinta de cruces de plataforma o ensamblajes estáticos.

2. **Identidad Halloween integrada:** El cuarto oscuro forense procesando evidencia perturbadora ofrece atmósfera sostenida sin depender de jumpscares. La mecánica está casada con el tema: revelar imágenes fotográficas progresivamente es literalmente "hacer visible lo oculto", metáfora central de Halloween. Las imágenes que empeoran con sobreexposición crean el dilema "ver demasiado" que es temáticamente rico.

3. **Alcance factible con densidad:** Cuatro fotografías con narrativa fragmentada son contenido acotado pero suficiente para experiencia completa. Cada foto puede tener timing distinto, patrones visuales únicos y contribuir a un misterio cohesivo. No requiere niveles múltiples para sentirse completo: la progresión es narrativa, no espacial. La química finita añade consecuencia sin necesitar sistemas complejos de recursos.

4. **Testeable y ajustable rápidamente:** El prototipo de rechazo (una foto en 3 horas) es verificable inmediatamente. Si genera tensión, el concepto tiene base; si no, se puede descartar antes de invertir días. El timing y dificultad de revelado son tuneables numéricamente sin reescribir lógica central. Audio y efectos visuales son aditivos, no requisitos para validar la idea.

**Advertencia explícita:** Esta es una **propuesta no aprobada**, no un nuevo plan oficial. Requiere tres validaciones previas obligatorias:

- **Búsqueda de predecesores**: Verificar que no existen juegos web de revelado fotográfico como puzzle (buscar "darkroom game", "photo development puzzle", "analog photography game"). Si existe precedente directo, el diferenciador colapsa.

- **Validación técnica de imágenes**: Confirmar que revelar progresivo con CSS/canvas genera la experiencia visual esperada. Si las transiciones se ven como simples fades sin carácter químico, la identidad se pierde.

- **Test emocional con humano real**: Mostrar prototipo mínimo a alguien sin contexto. Si no expresan incomodidad creciente al ver la imagen emerger, o si no sienten urgencia de decisión sobre cuándo detener, la tensión central no funciona y el concepto debe descartarse.

**Alternativas según resultado de validación:**

- Si El Revelado tiene precedente directo o falla test emocional, **La Máscara Incompleta (opción B)** es segundo candidato: diferenciador más débil pero factibilidad alta y estética clara.

- **El Teatro de Sombras Maldito (opción C)** mantiene teatro de papel del prototipo actual pero añade narrativa y urgencia temporal. Riesgo mayor de sentirse frustante. Considerarlo solo si opciones A y B son inviables.

---

## Siguientes pasos

Esta auditoría no autoriza cambios de código, Git, compras ni publicación. El participante debe:

1. Decidir si el prototipo actual se conserva, rediseña o descarta.
2. Si elige rediseño: seleccionar una dirección candidata y ejecutar sus tests de rechazo baratos.
3. Si el test es positivo: escribir especificación V4 con requisitos concretos antes de implementar.
4. Si ninguna dirección convence: buscar alternativas adicionales o reconsiderar participación en el concurso.

No reclamo que estas opciones ganen el concurso. Reclamo que El Revelado tiene mayor probabilidad de destacar que el cruce de sombras actual, sujeto a las validaciones nombradas. La decisión corresponde al participante tras revisar esta auditoría y verificar los precedentes de manera independiente.
