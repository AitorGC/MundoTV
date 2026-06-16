/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IPTVChannel } from "./types";

export interface EPGProgram {
  title: string;
  description: string;
  start: Date;
  end: Date;
}

/**
 * Generates a full 24-hour time-aware EPG schedule for a given channel of a specific category.
 * The output is deterministic based on the channel's name, so it remains consistent across re-renders
 * but dynamic across different hours of the day.
 */
export function getChannelEPG(channelId: string, category: string, channelName: string): EPGProgram[] {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  
  let programTemplates: { title: string; desc: string; durationMin: number }[] = [];
  const nameLower = channelName.toLowerCase();
  const catLower = (category || "").toLowerCase();

  if (nameLower.includes("nasa")) {
    programTemplates = [
      { title: "Estación Espacial en Vivo", desc: "Conexión directa con la ISS. Actividades cotidianas de los astronautas y vistas asombrosas de la Tierra.", durationMin: 120 },
      { title: "Expedición a Marte (Artemis)", desc: "Análisis técnico de los robots rover Perseverance y Curiosity en el cráter Jezero.", durationMin: 60 },
      { title: "Los Secretos del Telescopio Webb", desc: "Explorando las galaxias más lejanas a través de los ojos infrarrojos del telescopio espacial más avanzado.", durationMin: 90 },
      { title: "Caminata Espacial Histórica", desc: "Repetición de las misiones extravehiculares más peligrosas e inspiradoras de la NASA.", durationMin: 120 },
      { title: "Universo Profundo & Agujeros Negros", desc: "Un viaje visual por nebulosas, galaxias espirales, agujeros negros supermasivos y supernovas lejanas.", durationMin: 60 },
      { title: "Misión Artemis: Regreso a la Luna", desc: "Preparativos y desarrollo tecnológico del cohete SLS para llevar a la primera mujer a la superficie lunar.", durationMin: 90 }
    ];
  } else if (nameLower.includes("sintel")) {
    programTemplates = [
      { title: "Presentación Sintel HD", desc: "Disfruta de la película de animación abierta Sintel, una joven que busca a su pequeño dragón Scales.", durationMin: 45 },
      { title: "Cómo se Hizo: Animación 3D", desc: "Entrevistas con los desarrolladores de Blender y artistas que crearon este largometraje de animación de código abierto.", durationMin: 60 },
      { title: "Maratón de Cine Abierto", desc: "Proyección consecutiva de cortos experimentales creados por la Fundación Blender como Peach, Tears of Steel o Cosmos Laundromat.", durationMin: 90 },
      { title: "Diseño de Criaturas Digitales", desc: "Tutorial y demostración de escultura digital detallada utilizando herramientas de software libre de última generación.", durationMin: 60 },
      { title: "Efectos Visuales Avanzados", desc: "Creación de simulaciones de humo, fuego, colisiones y campos de fuerza mágicos.", durationMin: 90 }
    ];
  } else if (nameLower.includes("bunny") || catLower.includes("animation") || catLower.includes("animación")) {
    programTemplates = [
      { title: "Big Buck Bunny Classic", desc: "La divertida e icónica aventura de un conejo gigante contra tres rebeldes ardillas voladoras y traviesas.", durationMin: 30 },
      { title: "Cortometrajes Animados Populares", desc: "Recopilación de las mejores animaciones humorísticas en tres dimensiones creadas por la comunidad independiente.", durationMin: 65 },
      { title: "Modelado Digital de Personajes", desc: "Clase maestra sobre cómo pasar de un boceto tradicional a una hermosa malla poligonal lista para animar.", durationMin: 90 },
      { title: "Física de Animación y Comedia", desc: "Análisis técnico del ritmo 'slapstick' usado en las caricaturas clásicas y su traducción al modelado digital.", durationMin: 55 }
    ];
  } else if (catLower.includes("news") || catLower.includes("noticias") || catLower.includes("business")) {
    programTemplates = [
      { title: "Informativo Global Matinal", desc: "Resumen de las noticias internacionales más relevantes de la jornada con debates en directo sobre política internacional.", durationMin: 60 },
      { title: "Crónica de Negocios y Economía", desc: "El comportamiento del mercado financiero mundial, cotización de divisas, materias primas y nuevas startups.", durationMin: 60 },
      { title: "Mesa de Debate Continental", desc: "Análisis profundo con expertos invitados sobre geopolítica, acuerdos bilaterales y cumbres internacionales.", durationMin: 90 },
      { title: "Informativo Resumen", desc: "Última hora del acontecer internacional con enlaces a corresponsales destacados en todo el mundo.", durationMin: 45 },
      { title: "Tecnología, Ciencia y Futuro", desc: "Cómo los últimos avances en microchips, biotecnología espacial e IA generativa transforman el día a día.", durationMin: 60 },
      { title: "Crónica Semanal de Reportajes", desc: "Trabajos de investigación rigurosos sobre conflictos sociales, medio ambiente e innovación científica.", durationMin: 95 }
    ];
  } else if (catLower.includes("sports") || catLower.includes("deportes")) {
    programTemplates = [
      { title: "Resumen de Goles y Jugadas de Impacto", desc: "Repaso detallado de las jugadas espectaculares en las ligas de fútbol, básquetbol y tenis internacionales.", durationMin: 60 },
      { title: "Crónica de Motores de Alta Velocidad", desc: "Todo sobre el campeonato mundial de rallies, Fórmula 1, MotoGP y pruebas de resistencia clásicas.", durationMin: 90 },
      { title: "Ruedas de Prensa y Tácticas", desc: "Estrategias reveladas por entrenadores internacionales y declaraciones de deportistas destacados de la semana.", durationMin: 65 },
      { title: "Deportistas Extraordinarios", desc: "Biografías de hombres y mujeres que rompieron marcas históricas olímpicas y de resistencia física extrema.", durationMin: 60 },
      { title: "Previas en el Terreno de Juego", desc: "Análisis de formaciones de jugadores, estadísticas históricas y predicciones climáticas antes de los partidos.", durationMin: 85 }
    ];
  } else if (catLower.includes("music") || catLower.includes("música")) {
    programTemplates = [
      { title: "Top 40 Éxitos Globales", desc: "La lista definitiva con los videos musicales y sencillos más vistos de la escena global.", durationMin: 120 },
      { title: "Conciertos Íntimos en Acústico", desc: "Presentaciones exclusivas grabadas en entornos minimalistas por solistas y bandas del circuito independiente.", durationMin: 60 },
      { title: "Rock Classics & Leyendas", desc: "Un paseo melancólico y enérgico por los himnos del rock de los años 75, 80 y 90.", durationMin: 90 },
      { title: "Beats Electrónicos Non-Stop", desc: "Sesiones continuas mezcladas por DJs internacionales directo desde clubes y festivales mundiales.", durationMin: 120 },
      { title: "Canciones del Recuerdo", desc: "Viaje al pasado con baladas pop y melodías icónicas que formaron la banda sonora de generaciones pasadas.", durationMin: 60 }
    ];
  } else {
    // General fallback
    programTemplates = [
      { title: "Programa Especial de Variedades", desc: "Temas de conversación actuales, tendencias de estilo, manualidades creativas e invitados humorísticos.", durationMin: 90 },
      { title: "Documento de Geografía y Naturaleza", desc: "Explorando la fauna exótica de reservas protegidas, paisajes glaciales y ecosistemas bajo el mar.", durationMin: 60 },
      { title: "Serie Policial y de Intriga", desc: "Un capítulo clásico de detectives descifrando rompecabezas imposibles bajo la lluvia de la gran ciudad.", durationMin: 120 },
      { title: "Comedia al Aire", desc: "Monólogos de comediantes de stand-up, bocetos paródicos de la vida moderna y chistes virales.", durationMin: 60 },
      { title: "Rutas Turísticas de Ensueño", desc: "La guía para mochileros y sibaritas para descubrir hostales mágicos, castillos feudales y calas secretas.", durationMin: 90 },
      { title: "Escuela del Buen Gourmet", desc: "Aprende técnicas culinarias fundamentales de cocina fusión internacional guiado por reconocidos chefs de prestigio.", durationMin: 60 }
    ];
  }

  // Generate deterministic but continuous list
  const programs: EPGProgram[] = [];
  let currentStart = new Date(startOfDay.getTime());
  
  // Predictable template index using channelName string hash to keep schedule uniform on load
  let hash = 0;
  for (let i = 0; i < channelName.length; i++) {
    hash = channelName.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);

  let tempIndex = hash % programTemplates.length;

  // Add all programs of the day
  while (currentStart.getTime() < startOfDay.getTime() + 24 * 60 * 60 * 1000) {
    const template = programTemplates[tempIndex];
    const currentEnd = new Date(currentStart.getTime() + template.durationMin * 60 * 1000);
    
    programs.push({
      title: template.title,
      description: template.desc,
      start: new Date(currentStart.getTime()),
      end: new Date(currentEnd.getTime())
    });

    currentStart = currentEnd;
    tempIndex = (tempIndex + 1) % programTemplates.length;
  }

  return programs;
}

/**
 * Client-side parser for standard M3U / M3U8 IPTV playlists
 */
export function parseM3UPlaylist(text: string): IPTVChannel[] {
  const lines = text.split("\n");
  const parsedChannels: IPTVChannel[] = [];
  let currentInfo: { name: string; logo: string | null; group: string | null } | null = null;

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    if (line.startsWith("#EXTINF:")) {
      // #EXTINF:-1 tvg-logo="https://..." group-title="Noticias",Canal de Prueba
      const nameMatch = line.match(/,(.*?)$/);
      const name = nameMatch ? nameMatch[1].trim() : "Canal M3U";
      
      const logoMatch = line.match(/tvg-logo="(.*?)"/);
      const logo = logoMatch ? logoMatch[1] : null;
      
      const groupMatch = line.match(/group-title="(.*?)"/);
      const group = groupMatch ? groupMatch[1] : "Importados";

      currentInfo = { name, logo, group };
    } else if (!line.startsWith("#")) {
      // It's a stream URL
      // Validate it looks like a URL
      if (line.startsWith("http://") || line.startsWith("https://")) {
        const id = `custom_${Math.random().toString(36).substr(2, 9)}`;
        parsedChannels.push({
          id,
          name: currentInfo ? currentInfo.name : line.substring(line.lastIndexOf("/") + 1).split("?")[0] || "Canal Personalizado",
          logo: currentInfo ? currentInfo.logo : null,
          countries: ["M3U"],
          languages: ["es"],
          categories: [currentInfo ? (currentInfo.group || "Importados").toLowerCase().replace(/\s+/g, "_") : "importados"],
          streamUrl: line,
          isHttps: line.startsWith("https://"),
          status: "online",
          countryNames: ["Personalizado"],
          languageNames: ["Español"],
          categoryNames: [currentInfo ? currentInfo.group || "Importados" : "Importados"]
        });
      }
      currentInfo = null;
    }
  }
  return parsedChannels;
}
