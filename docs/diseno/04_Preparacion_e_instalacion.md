# Preparación para Kiroween 2026

**Revisión: 30 de octubre de 2026 · Perú · Proyecto V3/R1**

Esta guía reúne la comprobación del equipo, los pasos de cuenta y la documentación de construcción. No instala programas, registra cuentas, publica archivos ni inicia código. El evento ya está abierto: el cierre es el **4 de diciembre de 2026 a las 17:00 de Perú**. Participar no exige compra. [Bases oficiales](https://kiroween.devpost.com/rules).

## 1. Qué es Kiro y cuánto necesitamos pagar

Kiro es una herramienta de desarrollo con IA. Para este proyecto usaremos su editor de escritorio: permite trabajar sobre archivos y pasar de requisitos a diseño, tareas e implementación. Sus especificaciones organizan el trabajo en `requirements.md`, `design.md` y `tasks.md`. [Documentación de especificaciones](https://kiro.dev/docs/specs/).

El plan Free cuesta **US$0** e incluye **50 créditos**. Pro cuesta **US$20 por usuario al mes**, antes de impuestos, con 1.000 créditos. Los créditos miden trabajo: una petición compleja puede consumir varios; no equivalen a un número fijo de mensajes ni horas. Las peticiones al agente, la elaboración de especificaciones y las tareas pueden consumirlos. La promoción del primer ascenso a un plan pagado requiere tarjeta y tiene condiciones de facturación. **Recomendación: comenzar con Free y solicitar el beneficio del evento; no contratar Pro ahora.** [Precios y condiciones](https://kiro.dev/pricing/).

Kiroween permite solicitar **4.000 créditos gratuitos**, sujetos a revisión, con cuenta e identificador de Kiro. Solicitud hasta el **1 de diciembre a las 15:00 de Perú**; revisión indicada: 48 horas laborables. Canjear antes del 4 de diciembre; los créditos canjeados caducan el 31 de diciembre a las 23:59 PT. Es una concesión única. El participante informa que está esperando la concesión; no hemos comprobado el abono en su cuenta. [Recursos del evento](https://kiroween.devpost.com/resources).

## 2. Equipo comprobado

Inventario de solo lectura obtenido del sistema, programas registrados y versiones ejecutables. No se inspeccionaron contraseñas ni sesiones personales.

| Elemento | Resultado local | Acción |
| --- | --- | --- |
| Sistema | Windows 11 Pro, x64; aproximadamente 13,9 GiB de memoria detectada | Plataforma compatible con Kiro IDE; rendimiento real pendiente de probar |
| Kiro | Kiro IDE 1.4.62 (User), comprobado en registro y ejecutable después de la instalación realizada por el participante | Abrir, comprobar sesión y saldo; no se encontró una ventana abierta durante esta revisión |
| Node.js / npm | 22.13.1 / 10.9.2 | Ya funcionan; actualizar Node dentro de una rama LTS como mantenimiento |
| Git | 2.53.0.windows.2 | Utilizable; no hace falta reinstalar |
| Editores | VS Code y Visual Studio Community 2026 | Disponibles; Kiro será el editor principal del evento |
| Navegadores | Edge y Chrome | Utilizables para probar el juego |
| Grabación | OBS Studio 30.2.3 | Ya disponible; verificar una grabación breve al preparar la demo |

Node 22.13.1 cumple el mínimo publicado por Vite, 22.12+. La página de Node ofrece actualmente 22.23.4 LTS para esa rama: es una posible actualización conservadora; no hace falta cambiar de versión mayor para cumplir ese mínimo. No se ha actualizado nada. [Compatibilidad de Vite](https://vite.dev/guide/), [descargas oficiales de Node](https://nodejs.org/en/download).

## 3. Pasos que puedes hacer ahora

1. Abre [Kiroween 2026](https://kiroween.devpost.com/) y pulsa **Join hackathon**. Entra o crea tu cuenta de Devpost, revisa las bases y responde con tus datos reales. Participarás solo. Inscribirse y entregar el proyecto son pasos diferentes.
2. Descarga [Kiro IDE](https://kiro.dev/downloads/): elige **Windows User Installer (x64)** para tu equipo. Ejecuta el instalador oficial y abre Kiro. No copies la orden de instalación para Linux de la sección CLI.
3. Inicia sesión en Kiro con Google, GitHub o AWS Builder ID. Puedes usar una cuenta personal; no necesitas configurar una organización para nuestro flujo. Importar ajustes de VS Code es opcional. [Instalación y acceso](https://kiro.dev/docs/getting-started/installation/).
4. En el [panel de tu cuenta Kiro](https://app.kiro.dev/), busca el panel de uso y copia **User ID**, junto a tu correo y método de acceso. Este identificador no es tu nombre de GitHub ni el correo. [Cómo localizarlo](https://kiro.dev/docs/billing/related-questions/).
5. Desde [Resources](https://kiroween.devpost.com/resources), abre **Request your Kiro credits here** y completa la solicitud. Usa el mismo identificador de la cuenta donde trabajarás. Cuando llegue el enlace de canje, úsalo con esa cuenta y comprueba el saldo en el panel.
6. Comprueba acceso a GitHub y YouTube. Son cuentas necesarias para la entrega, no programas que debas instalar. El repositorio y vídeo se prepararán antes de publicarlos.

**Inscripción no comprobada:** el conector de Devpost devuelve un error de autenticación. Hay que reconectarlo si queremos continuar la inscripción desde este chat. La web oficial permite hacerla manualmente; no se ha enviado ningún formulario desde aquí. El formulario de créditos tampoco se ha enviado y su contenido completo no pudo leerse con la herramienta web; no se inventan sus campos.

## 4. Herramientas para nuestro juego

**Ruta recomendada:** aplicación 2D de navegador con **TypeScript + Vite + SVG/HTML/CSS**. Es una decisión técnica propuesta para V3/R1; las bases no imponen ese lenguaje. SVG permite representar plantillas, marco y sombras con geometría explícita; HTML permite controles y alternativas de teclado. La primera prueba de recorrido confirmará precisión, respuesta y legibilidad antes del arte final.

- **Instalación principal comprobada:** Kiro IDE. Git, Node y navegador también están disponibles. Falta comprobar el acceso efectivo a la cuenta y el saldo.
- **Dependencias del proyecto:** TypeScript y Vite se añadirán dentro de su carpeta al iniciar la construcción. No requieren instaladores de escritorio ni instalación global ahora.
- **Pruebas:** incorporar herramientas para comprobar geometría, estados y recorrido cuando exista implementación. Aún no se ha elegido ni instalado una batería de pruebas.
- **Publicación prevista:** alojamiento estático; GitHub Pages admite sitios desde repositorios públicos con GitHub Free. La configuración y el enlace se comprobarán antes de la entrega. [Documentación de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).

Esta ruta no requiere una base de datos, servidor propio o motor 3D. CLI, Crew, MCP y Powers son posibilidades de Kiro; se incorporarán solo si aportan una mejora demostrable. No son una lista de instalaciones obligatorias.

La carpeta de construcción es `C:\Users\51924\Documents\Kiroween2026\LaVentanaEquivocada`. La ubicación real de Documentos fue comprobada. Ya se preparó con copias de la documentación V3/R1 y un encargo inicial para Kiro; todavía no contiene código del juego ni ejecuciones de Kiro. La carpeta académica de Redes queda fuera de este proyecto.

## 5. Entrega y documentación

### Obligaciones oficiales

| Entregable | Qué prepararemos |
| --- | --- |
| GitHub público con licencia abierta reconocible | Fuentes, recursos e instrucciones reproducibles |
| `.kiro/` en la raíz, sin excluirla del repositorio | Archivos de trabajo reales de Kiro |
| Aplicación accesible por URL | Juego funcional y acceso de evaluación |
| Descripción del producto | Funcionamiento y características demostrables |
| Demo pública en YouTube, inferior a tres minutos | Recorrido del juego funcionando |

Fuente: [FAQ oficial](https://kiroween.devpost.com/details/faqs).

Además se exige una explicación del uso efectivo de Kiro. Las funciones mencionadas por el evento son ejemplos: no hay obligación de usar todas. Registraremos qué aportó cada herramienta y qué hubo que corregir. [Requisitos del evento](https://kiroween.devpost.com/).

Materiales en inglés o con traducción; acceso gratuito para el jurado hasta el fin de evaluación, 29 de enero de 2027. Proyecto nuevo dentro del período, declaración del material previo incorporado y derechos/licencias adecuados. Perú no figura entre las exclusiones enumeradas; cada participante debe comprobar mayoría de edad y demás condiciones personales. Para el premio estudiantil opcional se piden LinkedIn, correo universitario, carrera, año e institución y puede solicitarse prueba de matrícula. [Bases](https://kiroween.devpost.com/rules).

### Organización propuesta, no nombres de archivo impuestos por el concurso

- `README.md`: descripción, controles, cómo ejecutar/probar y enlaces.
- `LICENSE` y créditos de recursos: licencia del código y procedencia de arte, tipografías, sonido y librerías.
- `.kiro/specs/.../`: requisitos, diseño y tareas elaborados y utilizados con Kiro.
- `.kiro/steering/`: reglas persistentes del producto y del código. Mantener V3/R1, apoyo desde arriba, límites geométricos, teclado y recuperación del estado. [Steering](https://kiro.dev/docs/steering/).
- `.kiro/hooks/`, si los utilizamos: automatizaciones comprobadas. Candidato: ejecutar las comprobaciones geométricas cuando cambie el módulo correspondiente. [Hooks](https://kiro.dev/docs/hooks/).
- `docs/kiro-usage.md`: decisiones y ejemplos reales del trabajo con Kiro; separar lo hecho con otras herramientas.
- `docs/testing.md`: entorno, resultados, fallos conocidos y observaciones con personas. Los agentes no cuentan como participantes humanos.
- Carpeta de presentación: texto de Devpost, guion de vídeo, capturas y traducción. Preparar borradores; publicar después de revisarlos.

La documentación V3 actual seguirá siendo la base de diseño. Sus notas conservan su fecha de planificación; no se presentarán como ejecuciones de Kiro.

## 6. Trabajo y límites

**Tu parte:** acceder a tus cuentas, revisar y aceptar los términos personalmente, comprobar la inscripción, solicitar créditos y participar en decisiones y pruebas. No compartas contraseñas en el chat. Confirmar publicación y entrega cuando el resultado sea revisable.

**Mi parte:** trasladar V3/R1 a requisitos utilizables en Kiro, ayudar con la configuración, revisar lo que genere, comprobar geometría y recorrido, mejorar la experiencia con evidencia, y preparar documentación y presentación en inglés. Se anotará qué se probó y qué sigue pendiente.

**Límite operativo actual:** no hay una sesión de Kiro conectada y verificada desde este chat. Puedo preparar y revisar su trabajo; operar directamente su editor o CLI requiere instalarlo, iniciar sesión y comprobar el acceso disponible. Lo hecho aquí no constituye por sí mismo uso de Kiro. Sus funciones/modelos pueden variar por región y cuenta; la concesión de créditos no garantiza acceso a todas las funciones de pago ni suficiencia para cualquier alcance.

Antes de publicar, revisaremos archivos y recursos para que el repositorio abierto contenga solo material destinado a la entrega. Las compras, publicaciones y envío final no se han realizado. Ninguna revisión documental demuestra todavía que el juego funcione ni garantiza un premio.

## 7. Cuándo comenzar la construcción

- [ ] Inscripción confirmada en Devpost.
- [x] Kiro IDE instalado y comprobado localmente.
- [ ] Acceso funcional, cuenta identificada y saldo comprobados dentro de Kiro.
- [ ] Solicitud de créditos enviada; saldo gratuito o concedido disponible para el primer trabajo.
- [x] Carpeta propia preparada y documentación V3/R1 disponible en ella.
- [ ] Primer encargo dentro de Kiro: especificar y comprobar un recorrido provisional con lámpara, plantilla, marco y recuperación; sin ampliar mecánicas.

El primer hito será **un recorrido jugable que valide nuestras reglas**. Después se afinarán enseñanza, arte, sonido y presentación. Los cálculos existentes orientan ese trabajo; no sustituyen una partida real.
