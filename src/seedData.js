// =====================================================================
//  Datos del torneo extraídos de los CSV (bombos, grupos, partidos).
//  El grupo se guarda como letra ("A".."L"). Las fechas vienen en
//  formato DD/MM/YYYY y se convierten a ISO en seed.js.
// =====================================================================

// --- Equipos: name, bombo (1-4), grupo, pos_sorteo (1-4) ---
export const TEAMS = [
  { name: 'México',                bombo: 1, grupo: 'A', pos: 1 },
  { name: 'Sudáfrica',             bombo: 3, grupo: 'A', pos: 2 },
  { name: 'Corea del Sur',         bombo: 2, grupo: 'A', pos: 3 },
  { name: 'República Checa',       bombo: 4, grupo: 'A', pos: 4 },

  { name: 'Canadá',                bombo: 1, grupo: 'B', pos: 1 },
  { name: 'Bosnia',                bombo: 4, grupo: 'B', pos: 2 },
  { name: 'Qatar',                 bombo: 3, grupo: 'B', pos: 3 },
  { name: 'Suiza',                 bombo: 2, grupo: 'B', pos: 4 },

  { name: 'Brasil',                bombo: 1, grupo: 'C', pos: 1 },
  { name: 'Marruecos',             bombo: 2, grupo: 'C', pos: 2 },
  { name: 'Haití',                 bombo: 4, grupo: 'C', pos: 3 },
  { name: 'Escocia',               bombo: 3, grupo: 'C', pos: 4 },

  { name: 'Estados Unidos',        bombo: 1, grupo: 'D', pos: 1 },
  { name: 'Paraguay',              bombo: 3, grupo: 'D', pos: 2 },
  { name: 'Australia',             bombo: 2, grupo: 'D', pos: 3 },
  { name: 'Turquía',               bombo: 4, grupo: 'D', pos: 4 },

  { name: 'Alemania',              bombo: 1, grupo: 'E', pos: 1 },
  { name: 'Curazao',               bombo: 4, grupo: 'E', pos: 2 },
  { name: 'Costa de Marfil',       bombo: 3, grupo: 'E', pos: 3 },
  { name: 'Ecuador',               bombo: 2, grupo: 'E', pos: 4 },

  { name: 'Países Bajos',          bombo: 1, grupo: 'F', pos: 1 },
  { name: 'Japón',                 bombo: 2, grupo: 'F', pos: 2 },
  { name: 'Suecia',                bombo: 4, grupo: 'F', pos: 3 },
  { name: 'Túnez',                 bombo: 3, grupo: 'F', pos: 4 },

  { name: 'Bélgica',               bombo: 1, grupo: 'G', pos: 1 },
  { name: 'Egipto',                bombo: 3, grupo: 'G', pos: 2 },
  { name: 'Irán',                  bombo: 2, grupo: 'G', pos: 3 },
  { name: 'Nueva Zelanda',         bombo: 4, grupo: 'G', pos: 4 },

  { name: 'España',                bombo: 1, grupo: 'H', pos: 1 },
  { name: 'Cabo Verde',            bombo: 4, grupo: 'H', pos: 2 },
  { name: 'Arabia Saudita',        bombo: 3, grupo: 'H', pos: 3 },
  { name: 'Uruguay',               bombo: 2, grupo: 'H', pos: 4 },

  { name: 'Francia',               bombo: 1, grupo: 'I', pos: 1 },
  { name: 'Senegal',               bombo: 2, grupo: 'I', pos: 2 },
  { name: 'Irak',                  bombo: 4, grupo: 'I', pos: 3 },
  { name: 'Noruega',               bombo: 3, grupo: 'I', pos: 4 },

  { name: 'Argentina',             bombo: 1, grupo: 'J', pos: 1 },
  { name: 'Argelia',               bombo: 3, grupo: 'J', pos: 2 },
  { name: 'Austria',               bombo: 2, grupo: 'J', pos: 3 },
  { name: 'Jordania',              bombo: 4, grupo: 'J', pos: 4 },

  { name: 'Portugal',              bombo: 1, grupo: 'K', pos: 1 },
  { name: 'RD Congo',              bombo: 4, grupo: 'K', pos: 2 },
  { name: 'Uzbekistán',            bombo: 3, grupo: 'K', pos: 3 },
  { name: 'Colombia',              bombo: 2, grupo: 'K', pos: 4 },

  { name: 'Inglaterra',            bombo: 1, grupo: 'L', pos: 1 },
  { name: 'Croacia',               bombo: 2, grupo: 'L', pos: 2 },
  { name: 'Ghana',                 bombo: 4, grupo: 'L', pos: 3 },
  { name: 'Panamá',                bombo: 3, grupo: 'L', pos: 4 },
];

// --- Partidos de fase de grupos ---
// [id, grupo, jornada, equipo1, equipo2, fecha(DD/MM/YYYY), hora]
export const GROUP_MATCHES = [
  // Jornada 1
  ['G1','A',1,'México','Sudáfrica','11/06/2026','13:00'],
  ['G2','A',1,'Corea del Sur','República Checa','11/06/2026','19:00'],
  ['G7','B',1,'Canadá','Bosnia','12/06/2026','13:00'],
  ['G8','B',1,'Qatar','Suiza','12/06/2026','19:00'],
  ['G13','C',1,'Brasil','Marruecos','13/06/2026','13:00'],
  ['G14','C',1,'Haití','Escocia','13/06/2026','19:00'],
  ['G19','D',1,'Estados Unidos','Paraguay','14/06/2026','13:00'],
  ['G20','D',1,'Australia','Turquía','14/06/2026','19:00'],
  ['G25','E',1,'Alemania','Curazao','15/06/2026','13:00'],
  ['G26','E',1,'Costa de Marfil','Ecuador','15/06/2026','19:00'],
  ['G31','F',1,'Países Bajos','Japón','11/06/2026','13:00'],
  ['G32','F',1,'Suecia','Túnez','11/06/2026','19:00'],
  ['G37','G',1,'Bélgica','Egipto','12/06/2026','13:00'],
  ['G38','G',1,'Irán','Nueva Zelanda','12/06/2026','19:00'],
  ['G43','H',1,'España','Cabo Verde','13/06/2026','13:00'],
  ['G44','H',1,'Arabia Saudita','Uruguay','13/06/2026','19:00'],
  ['G49','I',1,'Francia','Senegal','14/06/2026','13:00'],
  ['G50','I',1,'Irak','Noruega','14/06/2026','19:00'],
  ['G55','J',1,'Argentina','Argelia','15/06/2026','13:00'],
  ['G56','J',1,'Austria','Jordania','15/06/2026','19:00'],
  ['G61','K',1,'Portugal','RD Congo','11/06/2026','13:00'],
  ['G62','K',1,'Uzbekistán','Colombia','11/06/2026','19:00'],
  ['G67','L',1,'Inglaterra','Croacia','12/06/2026','13:00'],
  ['G68','L',1,'Ghana','Panamá','12/06/2026','19:00'],
  // Jornada 2
  ['G3','A',2,'México','Corea del Sur','16/06/2026','16:00'],
  ['G4','A',2,'República Checa','Sudáfrica','16/06/2026','21:00'],
  ['G9','B',2,'Canadá','Qatar','17/06/2026','16:00'],
  ['G10','B',2,'Suiza','Bosnia','17/06/2026','21:00'],
  ['G15','C',2,'Brasil','Haití','18/06/2026','16:00'],
  ['G16','C',2,'Escocia','Marruecos','18/06/2026','21:00'],
  ['G21','D',2,'Estados Unidos','Australia','19/06/2026','16:00'],
  ['G22','D',2,'Turquía','Paraguay','19/06/2026','21:00'],
  ['G27','E',2,'Alemania','Costa de Marfil','20/06/2026','16:00'],
  ['G28','E',2,'Ecuador','Curazao','20/06/2026','21:00'],
  ['G33','F',2,'Países Bajos','Suecia','21/06/2026','16:00'],
  ['G34','F',2,'Túnez','Japón','21/06/2026','21:00'],
  ['G39','G',2,'Bélgica','Irán','16/06/2026','16:00'],
  ['G40','G',2,'Nueva Zelanda','Egipto','16/06/2026','21:00'],
  ['G45','H',2,'España','Arabia Saudita','17/06/2026','16:00'],
  ['G46','H',2,'Uruguay','Cabo Verde','17/06/2026','21:00'],
  ['G51','I',2,'Francia','Irak','18/06/2026','16:00'],
  ['G52','I',2,'Noruega','Senegal','18/06/2026','21:00'],
  ['G57','J',2,'Argentina','Austria','19/06/2026','16:00'],
  ['G58','J',2,'Jordania','Argelia','19/06/2026','21:00'],
  ['G63','K',2,'Portugal','Uzbekistán','20/06/2026','16:00'],
  ['G64','K',2,'Colombia','RD Congo','20/06/2026','21:00'],
  ['G69','L',2,'Inglaterra','Ghana','21/06/2026','16:00'],
  ['G70','L',2,'Panamá','Croacia','21/06/2026','21:00'],
  // Jornada 3
  ['G5','A',3,'República Checa','México','22/06/2026','16:00'],
  ['G6','A',3,'Sudáfrica','Corea del Sur','22/06/2026','19:00'],
  ['G11','B',3,'Suiza','Canadá','23/06/2026','16:00'],
  ['G12','B',3,'Bosnia','Qatar','23/06/2026','19:00'],
  ['G17','C',3,'Escocia','Brasil','24/06/2026','16:00'],
  ['G18','C',3,'Marruecos','Haití','24/06/2026','19:00'],
  ['G23','D',3,'Turquía','Estados Unidos','25/06/2026','16:00'],
  ['G24','D',3,'Paraguay','Australia','25/06/2026','19:00'],
  ['G29','E',3,'Ecuador','Alemania','26/06/2026','16:00'],
  ['G30','E',3,'Curazao','Costa de Marfil','26/06/2026','19:00'],
  ['G35','F',3,'Túnez','Países Bajos','27/06/2026','16:00'],
  ['G36','F',3,'Japón','Suecia','27/06/2026','19:00'],
  ['G41','G',3,'Nueva Zelanda','Bélgica','22/06/2026','16:00'],
  ['G42','G',3,'Egipto','Irán','22/06/2026','19:00'],
  ['G47','H',3,'Uruguay','España','23/06/2026','16:00'],
  ['G48','H',3,'Cabo Verde','Arabia Saudita','23/06/2026','19:00'],
  ['G53','I',3,'Noruega','Francia','24/06/2026','16:00'],
  ['G54','I',3,'Senegal','Irak','24/06/2026','19:00'],
  ['G59','J',3,'Jordania','Argentina','25/06/2026','16:00'],
  ['G60','J',3,'Argelia','Austria','25/06/2026','19:00'],
  ['G65','K',3,'Colombia','Portugal','26/06/2026','16:00'],
  ['G66','K',3,'RD Congo','Uzbekistán','26/06/2026','19:00'],
  ['G71','L',3,'Panamá','Inglaterra','27/06/2026','16:00'],
  ['G72','L',3,'Croacia','Ghana','27/06/2026','19:00'],
];

// --- Eliminatorias ---
// Cada slot puede resolverse desde un grupo (manual/auto) o desde el
// ganador/perdedor de otro partido (auto-propagación).
//   src: { match: 'P1'|null, type: 'winner'|'loser'|'group' }
// ronda: 1=16avos, 2=octavos, 3=cuartos, 4=semis, 5=final/3er puesto
const G = (label) => ({ label, src: { match: null, type: 'group' } });
const W = (label, match) => ({ label, src: { match, type: 'winner' } });
const L = (label, match) => ({ label, src: { match, type: 'loser' } });

export const KNOCKOUT_MATCHES = [
  // Dieciseisavos de Final (ronda 1)
  { id:'P1', fase:'Dieciseisavos de Final', ronda:1, orden:1, s1:G('2° Grupo A'), s2:G('2° Grupo B'), fecha:'28/06/2026', hora:'15:00', next:'O1' },
  { id:'P2', fase:'Dieciseisavos de Final', ronda:1, orden:2, s1:G('1° Grupo C'), s2:G('2° Grupo F'), fecha:'28/06/2026', hora:'19:00', next:'O2' },
  { id:'P3', fase:'Dieciseisavos de Final', ronda:1, orden:3, s1:G('1° Grupo E'), s2:G('3° Grupo A/B/C/D/F'), fecha:'29/06/2026', hora:'15:00', next:'O1' },
  { id:'P4', fase:'Dieciseisavos de Final', ronda:1, orden:4, s1:G('1° Grupo F'), s2:G('2° Grupo C'), fecha:'29/06/2026', hora:'19:00', next:'O3' },
  { id:'P5', fase:'Dieciseisavos de Final', ronda:1, orden:5, s1:G('2° Grupo E'), s2:G('2° Grupo I'), fecha:'30/06/2026', hora:'15:00', next:'O2' },
  { id:'P6', fase:'Dieciseisavos de Final', ronda:1, orden:6, s1:G('1° Grupo I'), s2:G('3° Grupo C/D/F/G/H'), fecha:'30/06/2026', hora:'19:00', next:'O3' },
  { id:'P7', fase:'Dieciseisavos de Final', ronda:1, orden:7, s1:G('1° Grupo A'), s2:G('3° Grupo C/E/F/H/I'), fecha:'01/07/2026', hora:'15:00', next:'O4' },
  { id:'P8', fase:'Dieciseisavos de Final', ronda:1, orden:8, s1:G('1° Grupo L'), s2:G('3° Grupo E/H/I/J/K'), fecha:'01/07/2026', hora:'19:00', next:'O4' },
  { id:'P9', fase:'Dieciseisavos de Final', ronda:1, orden:9, s1:G('1° Grupo G'), s2:G('3° Grupo A/E/H/I/J'), fecha:'02/07/2026', hora:'15:00', next:'O6' },
  { id:'P10', fase:'Dieciseisavos de Final', ronda:1, orden:10, s1:G('1° Grupo D'), s2:G('3° Grupo B/E/F/I/J'), fecha:'02/07/2026', hora:'19:00', next:'O6' },
  { id:'P11', fase:'Dieciseisavos de Final', ronda:1, orden:11, s1:G('1° Grupo H'), s2:G('2° Grupo J'), fecha:'03/07/2026', hora:'13:00', next:'O5' },
  { id:'P12', fase:'Dieciseisavos de Final', ronda:1, orden:12, s1:G('2° Grupo K'), s2:G('2° Grupo L'), fecha:'03/07/2026', hora:'16:00', next:'O5' },
  { id:'P13', fase:'Dieciseisavos de Final', ronda:1, orden:13, s1:G('1° Grupo B'), s2:G('3° Grupo E/F/G/I/J'), fecha:'03/07/2026', hora:'20:00', next:'O8' },
  { id:'P14', fase:'Dieciseisavos de Final', ronda:1, orden:14, s1:G('2° Grupo D'), s2:G('2° Grupo G'), fecha:'04/07/2026', hora:'15:00', next:'O7' },
  { id:'P15', fase:'Dieciseisavos de Final', ronda:1, orden:15, s1:G('1° Grupo J'), s2:G('2° Grupo H'), fecha:'04/07/2026', hora:'19:00', next:'O7' },
  { id:'P16', fase:'Dieciseisavos de Final', ronda:1, orden:16, s1:G('1° Grupo K'), s2:G('3° Grupo D/E/I/J/L'), fecha:'05/07/2026', hora:'17:00', next:'O8' },

  // Octavos de Final (ronda 2)
  { id:'O1', fase:'Octavos de Final', ronda:2, orden:1, s1:W('Ganador P1','P1'), s2:W('Ganador P3','P3'), fecha:'06/07/2026', hora:'16:00', next:'C1' },
  { id:'O2', fase:'Octavos de Final', ronda:2, orden:2, s1:W('Ganador P2','P2'), s2:W('Ganador P5','P5'), fecha:'06/07/2026', hora:'20:00', next:'C1' },
  { id:'O3', fase:'Octavos de Final', ronda:2, orden:3, s1:W('Ganador P4','P4'), s2:W('Ganador P6','P6'), fecha:'07/07/2026', hora:'16:00', next:'C2' },
  { id:'O4', fase:'Octavos de Final', ronda:2, orden:4, s1:W('Ganador P7','P7'), s2:W('Ganador P8','P8'), fecha:'07/07/2026', hora:'20:00', next:'C2' },
  { id:'O5', fase:'Octavos de Final', ronda:2, orden:5, s1:W('Ganador P11','P11'), s2:W('Ganador P12','P12'), fecha:'08/07/2026', hora:'16:00', next:'C3' },
  { id:'O6', fase:'Octavos de Final', ronda:2, orden:6, s1:W('Ganador P9','P9'), s2:W('Ganador P10','P10'), fecha:'08/07/2026', hora:'20:00', next:'C3' },
  { id:'O7', fase:'Octavos de Final', ronda:2, orden:7, s1:W('Ganador P14','P14'), s2:W('Ganador P15','P15'), fecha:'09/07/2026', hora:'16:00', next:'C4' },
  { id:'O8', fase:'Octavos de Final', ronda:2, orden:8, s1:W('Ganador P13','P13'), s2:W('Ganador P16','P16'), fecha:'09/07/2026', hora:'20:00', next:'C4' },

  // Cuartos de Final (ronda 3)
  { id:'C1', fase:'Cuartos de Final', ronda:3, orden:1, s1:W('Ganador O1','O1'), s2:W('Ganador O2','O2'), fecha:'11/07/2026', hora:'15:00', next:'S1' },
  { id:'C2', fase:'Cuartos de Final', ronda:3, orden:2, s1:W('Ganador O3','O3'), s2:W('Ganador O4','O4'), fecha:'11/07/2026', hora:'19:00', next:'S1' },
  { id:'C3', fase:'Cuartos de Final', ronda:3, orden:3, s1:W('Ganador O5','O5'), s2:W('Ganador O6','O6'), fecha:'12/07/2026', hora:'15:00', next:'S2' },
  { id:'C4', fase:'Cuartos de Final', ronda:3, orden:4, s1:W('Ganador O7','O7'), s2:W('Ganador O8','O8'), fecha:'12/07/2026', hora:'19:00', next:'S2' },

  // Semifinales (ronda 4) -> ganador a la Final, perdedor al 3er puesto
  { id:'S1', fase:'Semifinal', ronda:4, orden:1, s1:W('Ganador C1','C1'), s2:W('Ganador C2','C2'), fecha:'15/07/2026', hora:'19:00', next:'Final', nextLoser:'F3' },
  { id:'S2', fase:'Semifinal', ronda:4, orden:2, s1:W('Ganador C3','C3'), s2:W('Ganador C4','C4'), fecha:'16/07/2026', hora:'19:00', next:'Final', nextLoser:'F3' },

  // Tercer puesto y Final (ronda 5)
  { id:'F3', fase:'Partido por el Tercer Puesto', ronda:5, orden:1, s1:L('Perdedor S1','S1'), s2:L('Perdedor S2','S2'), fecha:'18/07/2026', hora:'15:00', next:null },
  { id:'Final', fase:'Final', ronda:5, orden:2, s1:W('Ganador S1','S1'), s2:W('Ganador S2','S2'), fecha:'19/07/2026', hora:'16:00', next:null },
];
