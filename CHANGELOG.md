# 📝 Historial de Versiones (Changelog) - IPTV Player

Todos los cambios notables realizados en el proyecto **IPTV Player** están documentados en este archivo.

---

## [1.2.0] - 2026-06-04
### 🚀 Mejoras y Correcciones Técnicas
*   **Infinite Scroll Mejorado**: Optimizada la fórmula de detección de scroll nativo (`scrollHeight - scrollTop <= clientHeight + offset`) utilizando redondeo matemático para evitar discrepancias en pantallas de alta densidad de pixeles (Retina, 2K o zoom inteligente).
*   **Desplazamiento Continuo**: Se amplió el búfer de precarga del canal en la barra lateral reduciendo la latencia de carga inicial e incrementando el tamaño del lote por página (`limit: 50`) para causar un desbordamiento vertical nativo y fluido sin cortes ni atascos.
*   **Optimizaciones CSS**: Se solucionaron los comportamientos de altura colapsada en contenedores flex con la integración de clases de comportamiento mínimo `min-h-0` y selectores adaptativos de pantalla (`lg:h-[calc(100vh-120px)]`).

---

## [1.1.0] - 2026-06-03
### ✨ Nuevas Características
*   **Servicio de Verificación de Flujo**: Añadido endpoint `/api/check-stream` para comprobar la disponibilidad real de cada canal de forma asíncrona antes de activarlo.
*   **Optimización de Ancho de Banda**: Modificada la solicitud HTTP a consultas `GET` rápidas con carga útil limitada de encabezado (`Range: bytes=0-100`) para validar que las señales transmitan de manera activa sin descargar el archivo multimedia completo.
*   **Indicadores de Estado (Offline)**: Integración visual de banderas de estado *"Offline"* y cargadores (*spinners*) inline sobre los elementos de la lista sidebar.

---

## [1.0.0] - 2026-05-20
### ⭐ Lanzamiento Inicial
*   **Interfaz de Usuario Premium**: Visualización estética adaptativa con soporte completo de temas (Luz y "Cosmic Slate" Oscuro).
*   **Filtros Inteligentes**: Indexación categorizada por Género, País, Idioma y Región conectado en tiempo real con colecciones públicas de *iptv-org*.
*   **Modo Cine**: Opción para enfocar al 100% la pantalla sobre el reproductor de video ocultando barras y paneles innecesarios.
*   **Historial y Favoritos**: Sistema autónomo para marcar favoritos persistentes y registrar las últimas reproducciones mediante almacenamiento local del navegador (`localStorage`).

---

## 👨‍💻 Autoría

Desarrollado y mantenido con pasión por **Aitor Santana**. Todo el código, diseño UX y lógica de servidores optimizada para streaming moderno.
