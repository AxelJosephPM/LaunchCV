# LaunchCV — Guía Rápida

Bienvenido a LaunchCV. Esta guía te explica los pasos esenciales para empezar.

---

## 1. Abrir la aplicación

Haz doble clic en el archivo **LaunchCV.exe** (o en el acceso directo si lo has creado en el escritorio).
La aplicación se abrirá directamente con tu perfil ya cargado.

---

## 2. Editar tu información

En el menú lateral izquierdo verás las secciones de tu perfil:

- **Personal Info** — Nombre, titular profesional, localización, email, teléfono.
- **Education** — Estudios universitarios y formación académica.
- **Experience** — Empleos, prácticas, cargos en asociaciones.
- **Certifications** — Títulos, certificaciones y cursos.
- **Languages** — Idiomas y nivel.
- **Skills** — Competencias técnicas y personales.
- **Links** — LinkedIn, GitHub y tu web personal.

Haz clic en la sección que quieras editar, escribe los cambios y pulsa el botón **Save** de esa sección.

Para añadir una nueva entrada (por ejemplo un nuevo título), pulsa **+ Add Education** y rellena los campos.

---

## 3. Guardar cambios

Puedes guardar desde cualquier sección con el botón **Save** de esa página,
o usar el botón **Save Profile** en la parte inferior del menú lateral.

Si todo va bien verás el mensaje: **Profile saved successfully.**

---

## 4. Generar tus CVs en HTML

1. Haz clic en **Generate** en el menú lateral.
2. Marca los formatos que quieres generar (Harvard, ATS, Modern, Photo Sidebar CV, etc.).
3. Pulsa **Generate Selected CVs (HTML)** o **Generate All CVs (HTML)**.
4. Los archivos se guardan en `output/HTML/`.

---

## 5. Generar tus CVs en PDF

1. En la sección **Generate**, busca el bloque **PDF Files**.
2. Pulsa **Generate Selected CVs (PDF)** o **Generate All CVs (PDF)**.
3. Los PDFs se guardan en `output/PDF/`.
4. Esto puede tardar unos segundos por formato. Espera el mensaje de confirmación.

Los PDFs se generan directamente desde la aplicación. No necesitas instalar nada extra.

---

## 6. Foto de perfil y logotipo

Si colocas los archivos `pablo-profile.jpg` y `launchcv-logo.png` en la carpeta raíz de la aplicación,
LaunchCV los usará automáticamente:

- La foto aparece en el CV Moderno, el CV Europeo y el CV con foto lateral (si los ajustes de privacidad lo permiten).
- La foto también aparece en la Web Card (si **Show Photo** está activado en **Privacy**).
- El logotipo reemplaza el icono de texto en el menú lateral y en la Web Card.

Si los archivos no están, la app funciona con normalidad pero sin foto ni logotipo personalizado.

---

## 7. Generar la Web Card y el código QR

1. Antes de generar, ve a **Web & QR** y comprueba la URL pública configurada.
   La URL temporal es: `https://axeljosephpm.github.io/LaunchCV/`
2. Vuelve a **Generate** y pulsa **Generate Web Card** y **Generate QR Code**.
3. Los archivos de la Web Card se guardan en `output/Web/` junto con las imágenes en `output/Web/assets/`.

---

## 8. Publicar en GitHub Pages

Para publicar la Web Card en internet usando GitHub Pages:

1. Ve a **Web & QR**.
2. Comprueba que la **URL pública** está configurada correctamente.
3. Pulsa **🌐 Prepare GitHub Pages Website**.
   - La app regenera la Web Card y la copia a la carpeta `docs/` del repositorio.
   - También copia los PDFs de los CVs con nombres de archivo seguros para la web.
4. El desarrollador (Axel) debe hacer `git commit` y `git push` de la carpeta `docs/`.
5. La primera vez, activa GitHub Pages en el repositorio:
   **Settings → Pages → master → /docs → Save**

La URL pública temporal es: **https://axeljosephpm.github.io/LaunchCV/**

Para más detalles, consulta el manual `manual/GitHub_Pages.md`.

---

## 8. Abrir la carpeta de resultados

Pulsa **Open Output Folder** en la sección **Generate**.
Se abrirá el explorador de archivos directamente en la carpeta con todos tus archivos generados.

---

## 9. Crear una copia de seguridad

Ve a **Backup** en el menú lateral y pulsa **Create Backup Now**.
LaunchCV guardará una copia de toda tu información.

---

¿Algo no funciona como esperas? Consulta el **Manual de Usuario** para soluciones a los problemas más comunes.
