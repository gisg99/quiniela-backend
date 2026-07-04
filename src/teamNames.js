// =====================================================================
//  Diccionario de nombres de selección: nombre local (español) <-> nombre
//  que devuelve API-Football (inglés). Es la pieza que permite casar los
//  fixtures de la API con los equipos de nuestra base de datos.
//
//  Para cada equipo local guardamos una lista de alias aceptados. El
//  emparejamiento es "tolerante": se normaliza (minúsculas, sin acentos,
//  solo letras/números) antes de comparar, así que "Costa de Marfil",
//  "Ivory Coast" y "Cote d'Ivoire" caen todos en el mismo cubo.
//
//  Si algún equipo no casa (la API usa otro nombre), NO hay que tocar la
//  lógica: basta con añadir el alias que reporte el preview aquí abajo.
// =====================================================================

// Normaliza un nombre para comparar: minúsculas, quita acentos y todo lo
// que no sea a-z / 0-9.
export function norm(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // acentos
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

// nombre local (tal cual en la tabla teams) -> alias aceptados
export const TEAM_ALIASES = {
  'México':               ['Mexico'],
  'Sudáfrica':            ['South Africa'],
  'Corea del Sur':        ['South Korea', 'Korea Republic', 'Republic of Korea'],
  'República Checa':      ['Czech Republic', 'Czechia'],
  'Canadá':               ['Canada'],
  'Bosnia y Herzegovina': ['Bosnia and Herzegovina', 'Bosnia & Herzegovina', 'Bosnia'],
  'Qatar':                ['Qatar'],
  'Suiza':                ['Switzerland'],
  'Brasil':               ['Brazil'],
  'Marruecos':            ['Morocco'],
  'Haití':                ['Haiti'],
  'Escocia':              ['Scotland'],
  'Estados Unidos':       ['USA', 'United States', 'United States of America'],
  'Paraguay':             ['Paraguay'],
  'Australia':            ['Australia'],
  'Turquía':              ['Turkey', 'Türkiye', 'Turkiye'],
  'Alemania':             ['Germany'],
  'Curazao':              ['Curacao', 'Curaçao'],
  'Costa de Marfil':      ['Ivory Coast', 'Cote d\'Ivoire', "Côte d'Ivoire"],
  'Ecuador':              ['Ecuador'],
  'Países Bajos':         ['Netherlands', 'Holland'],
  'Japón':                ['Japan'],
  'Suecia':               ['Sweden'],
  'Túnez':                ['Tunisia'],
  'Bélgica':              ['Belgium'],
  'Egipto':               ['Egypt'],
  'Irán':                 ['Iran'],
  'Nueva Zelanda':        ['New Zealand'],
  'España':               ['Spain'],
  'Cabo Verde':           ['Cape Verde', 'Cabo Verde'],
  'Arabia Saudita':       ['Saudi Arabia'],
  'Uruguay':              ['Uruguay'],
  'Francia':              ['France'],
  'Senegal':              ['Senegal'],
  'Irak':                 ['Iraq'],
  'Noruega':              ['Norway'],
  'Argentina':            ['Argentina'],
  'Argelia':              ['Algeria'],
  'Austria':              ['Austria'],
  'Jordania':             ['Jordan'],
  'Portugal':             ['Portugal'],
  'RD Congo':             ['DR Congo', 'Congo DR', 'Democratic Republic of Congo', 'DR-Congo'],
  'Uzbekistán':           ['Uzbekistan'],
  'Colombia':             ['Colombia'],
  'Inglaterra':           ['England'],
  'Croacia':              ['Croatia'],
  'Ghana':                ['Ghana'],
  'Panamá':               ['Panama'],
};

// Índice inverso normalizado: alias-normalizado -> nombre local.
// Incluye también el propio nombre local como alias de sí mismo.
const NORM_TO_LOCAL = (() => {
  const map = {};
  for (const [local, aliases] of Object.entries(TEAM_ALIASES)) {
    map[norm(local)] = local;
    for (const a of aliases) map[norm(a)] = local;
  }
  return map;
})();

// Dado un nombre de la API, devuelve el nombre local equivalente o null.
export function apiNameToLocal(apiName) {
  return NORM_TO_LOCAL[norm(apiName)] || null;
}
