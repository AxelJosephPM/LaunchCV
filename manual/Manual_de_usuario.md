# LaunchCV — Manual de Usuario

Versión 1.0 · Para uso en Windows sin conocimientos de programación.

---

## ¿Qué es LaunchCV?

LaunchCV es una aplicación de escritorio que te permite crear y mantener tu currículum vitae profesional de forma sencilla.
Sin necesidad de Word, sin formularios en línea, sin perder el formato.

Con LaunchCV puedes:
- Editar tu perfil profesional en formularios visuales.
- Generar tu CV en varios formatos (Harvard, ATS, Moderno y más).
- Crear tu tarjeta digital Web Card para compartir con un código QR.
- Generar un archivo de contacto (.vcf) para que te añadan fácilmente a la agenda.
- Guardar copias de seguridad de toda tu información.

---

## Pantallas y secciones

### Menú lateral izquierdo

El menú lateral te lleva a las distintas secciones de la aplicación:

| Sección | Qué contiene |
|---|---|
| Personal Info | Nombre, titulación, localización, contacto |
| Education | Estudios universitarios y otros |
| Experience | Experiencia laboral, prácticas, asociaciones |
| Certifications | Certificados y títulos obtenidos |
| Languages | Idiomas y nivel de dominio |
| Skills | Competencias técnicas y personales |
| Links | Redes sociales y páginas web |
| Generate | Botones para generar todos los archivos |
| Preview | Vista previa del CV antes de generarlo |
| Web & QR | Configuración de la tarjeta digital y el QR |
| Privacy | Control de qué datos aparecen en la web |
| Backup | Copias de seguridad |

En la parte inferior del menú hay dos botones de idioma: **EN** (inglés) y **ES** (español).
Puedes tener dos versiones del perfil, una en cada idioma.

---

## Editar información personal

1. Haz clic en **Personal Info** en el menú.
2. Rellena los campos: nombre, apellidos, titular, localización, email, teléfono.
3. Pulsa **Save Personal Info**.

El campo **Headline** es tu titulo profesional breve, por ejemplo: *Aerospace Engineering Student*.

---

## Añadir estudios (Education)

1. Ve a **Education**.
2. Pulsa **+ Add Education** para añadir una nueva entrada.
3. Rellena: nombre de la institución, título, especialidad, fechas y localización.
4. Repite para cada formación que quieras incluir.
5. Pulsa **Save Education** cuando hayas terminado.

Para eliminar una entrada, pulsa la **✕** en la esquina derecha de esa tarjeta.

---

## Añadir experiencia (Experience)

1. Ve a **Experience**.
2. Pulsa **+ Add Experience**.
3. Rellena: cargo, organización, tipo (tiempo completo, parcial...), fechas y descripción.
4. Si el puesto es actual, escribe **Present** como fecha de fin.
5. Pulsa **Save Experience**.

---

## Añadir proyectos

La sección de proyectos se añadirá en una versión futura.
Por ahora puedes incluir proyectos relevantes dentro de la sección Experience.

---

## Añadir certificaciones (Certifications)

1. Ve a **Certifications**.
2. Pulsa **+ Add Certification**.
3. Rellena: nombre del certificado, entidad emisora y fecha.
4. Pulsa **Save Certifications**.

---

## Elegir qué CV usar

En **Generate** encontrarás una lista con todos los formatos disponibles:

| Formato | Para qué sirve | Aspecto |
|---|---|---|
| **Harvard-style CV** | Becas, universidades, programas internacionales | Clásico, blanco y negro, tipografía serif |
| **ATS-Friendly CV** | Portales de empleo con lectura automática | Sin columnas, sin iconos, texto plano |
| **Modern CV** | Envío directo, primera impresión visual | Dos columnas, sidebar azul marino |
| **European CV** | Programas europeos, Erasmus, convocatorias institucionales | Sidebar azul con datos personales e idiomas, contenido principal a la derecha |
| **Academic CV** | Profesores, grupos de investigación, becas de verano, programas universitarios | Página completa, tipografía serif, secciones académicas, lista de intereses de investigación |
| **One-Page CV** | Ferias de empleo, correos rápidos, primera toma de contacto informal | Muy compacto, máximo 2 experiencias, máximo 6 habilidades, diseñado para una sola página |
| **International Resume** | Empresas internacionales, prácticas en el extranjero, reclutadores angloparlantes | Limpio y directo, experiencia con viñetas de logros, habilidades técnicas agrupadas |
| **Photo Sidebar CV** | Empresas pequeñas, asociaciones estudiantiles, candidaturas directas donde se acepta un CV visual | Sidebar izquierdo con foto circular, nombre y datos de contacto; experiencia y formación en la zona principal |

### ¿Cuál debo elegir?

- Para una universidad española o europea → **Harvard** o **European CV**
- Para un portal de empleo como LinkedIn Easy Apply, InfoJobs o similar → **ATS-Friendly**
- Para enviar por correo a una empresa → **Modern** o **International Resume**
- Para un programa de investigación o beca académica → **Academic CV**
- Para una feria de empleo o un primer contacto rápido → **One-Page CV**
- Para una empresa pequeña, asociación o candidatura directa donde se acepta foto → **Photo Sidebar CV**

> **Nota:** El **Photo Sidebar CV** no es apto para portales ATS. Úsalo solo cuando el destinatario lo va a leer directamente, no cuando lo procesa un sistema automático.

Marca los que quieras y pulsa **Generate Selected CVs**.

### Dónde se guardan los archivos generados

Cada formato se guarda en su propia subcarpeta dentro de `output/HTML/`:

```
output/HTML/
├── Harvard/       → Pablo_CV_harvard.html
├── ATS/           → Pablo_CV_ats.html
├── Modern/        → Pablo_CV_modern.html
├── European/      → Pablo_CV_European.html
├── Academic/      → Pablo_CV_Academic.html
├── OnePage/       → Pablo_CV_OnePage.html
├── International/ → Pablo_Resume_International.html
└── PhotoSidebar/  → Pablo_Codón_Castellano_CV_PhotoSidebar.html
```

Puedes abrir cualquiera de estos archivos directamente en tu navegador para revisarlo o imprimirlo en PDF desde ahí.

---

## Cómo funciona la Web Card

La Web Card es una página web con tu perfil profesional.
Se genera en la carpeta `output/Web/` y contiene:

- Tu nombre y titular.
- Un breve resumen profesional.
- Botones para descargar tus CVs en PDF.
- Un botón para añadirte como contacto.

Para que sea accesible desde el QR, se publica en GitHub Pages desde la carpeta `docs/`.

### Publicar en GitHub Pages

1. Ve a **Web & QR** y comprueba la URL pública (`https://axeljosephpm.github.io/LaunchCV/`).
2. Pulsa **🌐 Prepare GitHub Pages Website**.
   La app regenera la Web Card y la copia a `docs/` con los PDFs.
3. El desarrollador hace `git push` para publicar los cambios.
4. La primera vez, activa GitHub Pages en GitHub:
   **Settings → Pages → master → /docs → Save**

URL temporal: **https://axeljosephpm.github.io/LaunchCV/**

Para la guía completa de GitHub Pages, consulta `manual/GitHub_Pages.md`.

---

## Cómo funciona el QR

El código QR generado apunta a tu Web Card pública.
Lo encontrarás en `output/QR/qr_card.png`.

Si no has configurado una URL pública, el QR apuntará a una dirección provisional y verás un aviso.
Para configurarlo, ve a **Web & QR** y rellena tu URL de GitHub Pages.

---

## Configuración de privacidad

En **Privacy** puedes decidir qué datos aparecen en tu Web Card pública:

- Mostrar / ocultar email.
- Mostrar / ocultar teléfono.
- Mostrar / ocultar dirección.
- Mostrar / ocultar foto.
- Activar / desactivar botones de descarga de CV.
- Mostrar / ocultar sección de proyectos.
- Mostrar / ocultar sección de experiencia.

Pulsa **Save Privacy Settings** tras ajustar los interruptores.

---

## Crear copias de seguridad

1. Ve a **Backup**.
2. Pulsa **💾 Create Backup Now**.
3. LaunchCV guardará una copia de todos tus datos con la fecha y hora actuales.

---

## Restaurar una copia de seguridad

1. En la sección **Backup**, verás la lista de copias disponibles.
2. Selecciona la que quieras restaurar.
3. Pulsa **Restore Selected**.
4. Tu perfil volverá al estado guardado en esa copia.

---

## Generar archivos PDF

En la sección **Generate**, encontrarás el bloque **PDF Files**:

- **Generate Selected CVs (PDF)** — genera PDF sólo de los formatos marcados con la casilla.
- **Generate All CVs (PDF)** — genera PDF de todos los formatos de una vez.

Los PDFs se generan directamente desde la app, sin necesidad de instalar herramientas externas.
Cada generación puede tardar varios segundos por formato.

Los archivos se guardan en `output/PDF/` con nombres como:
- `Pablo_Codón_Castellano_CV_Harvard.pdf`
- `Pablo_Codón_Castellano_CV_Modern.pdf`
- `Pablo_Codón_Castellano_CV_PhotoSidebar.pdf`
- `Pablo_Codón_Castellano_Resume_International.pdf`
- etc.

---

## Foto de perfil

Si tienes el archivo `pablo-profile.jpg` en la carpeta raíz de la aplicación, LaunchCV lo usará como foto de perfil.

La foto aparece en:
- **CV Moderno** — siempre que la privacidad lo permita.
- **CV Europeo** — siempre que la privacidad lo permita.
- **Photo Sidebar CV** — siempre que la privacidad lo permita. Si no hay foto, se muestra un círculo con las iniciales.
- **Web Card** — sólo si **Show Photo** está activado en **Privacy**.

En los demás formatos (Harvard, ATS, Academic, International, One-Page) no se incluye foto por defecto.

Si el archivo no existe, los CVs se generan con normalidad pero sin foto.
Verás un aviso en la sección **Generate** si la foto falta.

---

## Logotipo de la aplicación

Si tienes el archivo `launchcv-logo.png` en la carpeta raíz, LaunchCV lo mostrará en:
- El menú lateral de la aplicación.
- La Web Card generada.

Si el archivo no existe, se usa texto como alternativa. La app no falla.

---

## Abrir los archivos generados

Pulsa **Open Output Folder** en la sección **Generate**.
Se abrirá el Explorador de Windows directamente en la carpeta `output/`.

La estructura de carpetas es:
```
output/
├── HTML/         → CVs en formato web/HTML
│   ├── Harvard/
│   ├── ATS/
│   ├── Modern/
│   ├── European/
│   ├── Academic/
│   ├── OnePage/
│   ├── International/
│   └── PhotoSidebar/
├── PDF/          → CVs en formato PDF (todos los formatos)
├── Web/          → Web Card generada
│   └── assets/  → Foto de perfil y logotipo para la web
├── QR/           → El código QR en PNG
├── Contact/      → El archivo .vcf de contacto
└── Logs/         → Registro interno de la aplicación
```

---

## Configuración de privacidad

En **Privacy** puedes decidir qué datos aparecen en tu Web Card pública:

- Mostrar / ocultar email.
- Mostrar / ocultar teléfono.
- Mostrar / ocultar dirección.
- **Mostrar / ocultar foto** — controla si la foto aparece en la Web Card, CV Moderno y CV Europeo.
- Activar / desactivar botones de descarga de CV.
- Mostrar / ocultar sección de proyectos.
- Mostrar / ocultar sección de experiencia.

Pulsa **Save Privacy Settings** tras ajustar los interruptores.

---

## Crear copias de seguridad

1. Ve a **Backup**.
2. Pulsa **Create Backup Now**.
3. LaunchCV guardará una copia de todos tus datos con la fecha y hora actuales.

---

## Restaurar una copia de seguridad

1. En la sección **Backup**, verás la lista de copias disponibles.
2. Selecciona la que quieras restaurar.
3. Pulsa **Restore Selected**.
4. Tu perfil volverá al estado guardado en esa copia.

---

## Problemas frecuentes

**La aplicación no abre.**
Asegúrate de que el archivo LaunchCV.exe está en una carpeta donde tienes permisos de escritura.
No lo ejecutes desde el escritorio si está en una carpeta protegida.

**Los archivos HTML se generan pero los PDFs no.**
Comprueba que la carpeta `output/PDF/` existe. Si no existe, la aplicación la crea automáticamente.
Si el problema persiste, cierra y vuelve a abrir la aplicación e inténtalo de nuevo.

**Los PDFs tardan mucho.**
Es normal. Cada formato abre una ventana interna invisible para renderizar el HTML y exportarlo.
Siete formatos pueden tardar hasta un minuto. Espera el mensaje de confirmación.

**No aparece la foto en el CV.**
Comprueba que el archivo `pablo-profile.jpg` está en la carpeta raíz de la aplicación.
También asegúrate de que el ajuste **Show Photo** está activado en **Privacy**.
La foto sólo aparece en el CV Moderno, el CV Europeo, el Photo Sidebar CV y la Web Card.
Si no hay foto y usas el Photo Sidebar CV, verás un círculo con las iniciales en lugar de la foto.

**El QR no abre mi página.**
Debes subir primero la carpeta `output/Web/` a un servidor web (como GitHub Pages) y configurar la URL en **Web & QR**.

**Perdí mis datos al actualizar.**
Por eso existe la función de copia de seguridad. Antes de actualizar, crea siempre una copia desde **Backup**.

---

*LaunchCV ha sido desarrollado con cariño para ayudarte a despegar en tu carrera.*
