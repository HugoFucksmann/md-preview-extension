# MD Preview Default

Extensión para VS Code que abre archivos `.md` renderizados por defecto como editor personalizado, con alternancia fluida entre **Preview** y **Source** en la misma pestaña y sincronización bidireccional de lectura.

---

## ✨ Características

- 📑 **Apertura renderizada por defecto**: Al abrir un archivo `.md`, se visualiza directamente en modo vista previa sin pestañas divididas adicionales.
- 🔄 **Alternar Preview / Source**:
  - Botón en la barra de títulos del editor (`$(code)` / `$(open-preview)`).
  - Atajo de teclado: `Ctrl+Alt+M` (o `Cmd+Alt+M` en macOS).
  - Mantiene y sincroniza la posición de scroll / línea activa entre ambos modos.
- 🧭 **Índice lateral dinámico (TOC)**:
  - Generado a partir de encabezados `H1` a `H4`.
  - Desplazamiento suave al hacer clic en cualquier sección.
  - Seguimiento visual activo (indicador naranja) según el scroll de lectura.
  - Botón flotante `☰` para mostrar u ocultar el panel lateral.
- 🎨 **Callouts estilo GitHub (Alerts)**:
  - Soporte para bloques destacados: `> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]` y `> [!CAUTION]`.
- 💻 **Bloques de código enriquecidos**:
  - Resaltado de sintaxis automático con `highlight.js`.
  - Etiqueta identificadora del lenguaje.
  - Botón flotante **Copiar** con feedback visual al portapapeles.
- 📊 **Diagramas Mermaid interactivos**:
  - Renderizado nativo de bloques ` ```mermaid `.
  - Soporte de **Zoom** (rueda del mouse o botones `+` / `-`) y **Pan** (arrastre con el mouse).
  - Controles flotantes para restablecer la vista.
- 🧮 **Matemáticas con KaTeX**:
  - Fórmulas matemáticas en línea (`$...$`) y en bloque (`$$...$$`).
  - Totalmente sanitizado para seguridad sin romper el renderizado KaTeX.
- ☑️ **Listas de tareas interactivas**:
  - Los checkboxes `- [ ]` y `- [x]` se pueden marcar/desmarcar con un clic directamente desde el Preview y actualizan el archivo Markdown fuente en tiempo real.
- 🖼️ **Visor modal de imágenes**:
  - Clic en imágenes para abrirlas a pantalla completa con controles de zoom y arrastre. Cierre con tecla `Esc` o botón `✕`.
- 🔍 **Búsqueda integrada**:
  - Barra de búsqueda interna (`Ctrl+F` o botón flotante de lupa `🔍`).
  - Navegación entre resultados con `Enter` / `Shift+Enter` y resaltado nativo con `CSS Custom Highlight API`.
- 🔗 **Extras de Markdown**:
  - Soporte para listas de definición (`deflist`), notas al pie (`footnotes`) y emojis con sintaxis `:emoji:`.

---

## ⚙️ Configuración

Puedes personalizar la extensión desde los ajustes de VS Code (`settings.json`):

| Ajuste | Tipo | Por defecto | Descripción |
| :--- | :---: | :---: | :--- |
| `mdPreview.fontSize` | `number` | `15` | Tamaño de la fuente del contenido del Preview (en px, mín. 10, máx. 40). |
| `mdPreview.contentWidth` | `number` | `920` | Ancho máximo del contenedor de texto en px. Usa `0` para ocupar el ancho completo. |

---

## ⌨️ Comandos y Atajos

| Comando | Atajo | Descripción |
| :--- | :---: | :--- |
| `mdPreview.toggle` | `Ctrl+Alt+M` / `Cmd+Alt+M` | Alterna entre vista previa y código fuente en la pestaña activa. |
| `mdPreview.showSource` | *(Icono barra)* | Cambia del Preview al editor de texto plano. |
| `mdPreview.showPreview` | *(Icono barra)* | Cambia del editor de texto plano al Preview. |

---

## 🚀 Instalación y Desarrollo

### Requisitos
- **Node.js**: v20 o superior
- **VS Code**: v1.85.0 o superior

### Compilar y empaquetar

1. Clona e instala dependencias:
   ```bash
   npm install
   ```

2. Compila la extensión y copia los assets:
   ```bash
   npm run build
   ```

3. Genera el paquete `.vsix`:
   ```bash
   npm run package
   ```

4. Para instalarlo en VS Code / Antigravity:
   - Abre la paleta de comandos (`Ctrl+Shift+P` o `Cmd+Shift+P`).
   - Selecciona **Extensions: Install from VSIX...** y elige el archivo `.vsix` generado.
   - Recarga la ventana con **Developer: Reload Window**.

---

## 📄 Licencia

Este proyecto está distribuido bajo la licencia MIT. Consulta el archivo LICENSE para más detalles.
