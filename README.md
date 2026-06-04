# 📺 IPTV Player - Plataforma de Streaming Inteligente

Una aplicación web de alto rendimiento, moderna y elegante diseñada para sintonizar y gestionar miles de canales de televisión públicos de **iptv-org** con un reproductor de video adaptativo HLS incorporado, filtros multidimensionales y automatizaciones inteligentes.

---

## ✨ Características Destacadas

*   **⚡ Reproductor HLS Integrado**: Soporte completo para transmisiones `.m3u8` utilizando `hls.js`, garantizando una reproducción fluida, de baja latencia y con controles nativos avanzados.
*   **🔍 Filtros Multidimensionales**: Clasificación inteligente y exploración instantánea de canales agrupados por **Categoría**, **País**, **Idioma** y **Región**.
*   **🛠️ Verificador de Flujos en Tiempo Real**: API externa que analiza el estado activo/inactivo de las transmisiones mediante peticiones rápidas `GET` con rangos de bytes parciales para reducir el consumo de ancho de banda y evitar esperas en enlaces rotos.
*   **💻 Integración PC/VLC**: Sección especializada para sincronizar y abrir canales directamente en reproductores externos de escritorio como VLC para aquellos flujos restringidos por CORS en navegadores.
*   **❤️ Favoritos e Historial**: Persistencia local ultra-ligera para guardar tus canales preferidos y llevar un registro de las reproducciones recientes a través de múltiples sesiones.
*   **🌓 Interfaz Dual Inteligente**: Alterna sin fricciones entre un diseño claro minimalista y un elegante tema oscuro "Cosmic Slate" con transiciones suaves y optimización visual para pantallas OLED.
*   **🚀 Carga Infinita de Alto Rendimiento**: Paginación inteligente y optimizada tanto en cliente como en servidor para navegar por miles de canales de manera fluida y sin interrupciones.

---

## 🛠️ Tecnologías Utilizadas

*   **Frontend**: React (TypeScript) + Vite + Tailwind CSS para una interfaz reactiva, moderna y con tipografía pulida.
*   **Animaciones**: `motion` para micro-interacciones, transiciones de reproducción y efectos estéticos fluidos.
*   **Backend**: Node.js + Express (TypeScript) utilizando `tsx` y compilado mediante `esbuild` para tiempos de respuesta ultra-rápados de la API de canales.
*   **Streaming**: `hls.js` integrado de manera nativa para reproducción fluida de streaming adaptativo en formato HTTP Live Streaming (HLS).

---

## 🚀 Instalación y Despliegue Local

### Requisitos Previos

Asegúrate de contar con **Node.js (v18+)** y **npm** instalados en tu sistema.

### Pasos para Ejecutar

1.  **Clonar o descargar los archivos de este proyecto**.
2.  **Instalar las dependencias de la aplicación**:
    ```bash
    npm install
    ```
3.  **Iniciar el servidor de desarrollo unificado (unifica Express + Vite en paralelo)**:
    ```bash
    npm run dev
    ```
    La aplicación estará disponible inmediatamente en `http://localhost:3000`.

4.  **Generar compilación de producción optimizada**:
    ```bash
    npm run build
    ```
5.  **Iniciar en servidor de producción**:
    ```bash
    npm run start
    ```

---

## 📁 Arquitectura e Implementación Clave

*   `server.ts` - Servidor backend en Express que gestiona el parseo recursivo de listas M3U oficiales, la agregación dinámica de metadatos, los filtros, la paginación y la API automatizada para validar enlaces vivos en milisegundos.
*   `src/App.tsx` - Núcleo de la SPA en React que sincroniza de forma fluida el reproductor HLS, el historial, el guardado de favoritos en el navegador, la selección temática clara/oscura y la carga ilimitada de la barra lateral lateral derecha.
*   `src/index.css` - Estilos Tailwind y personalizaciones de las barras de desplazamiento (*custom scrollbars*) optimizadas estéticamente para armonizar con el tema escogido.

---

## 👨‍💻 Créditos

Desarrollado con pasión y dedicación por **Aitor Santana**. Diseñado para redefinir el entretenimiento digital combinando simplicidad visual con el más alto refinamiento técnico.

---

*Aviso: Este proyecto tiene fines educativos y demostrativos. Las transmisiones en vivo son accesos recopilados públicamente y se reproducen sin alterar su origen original.*
