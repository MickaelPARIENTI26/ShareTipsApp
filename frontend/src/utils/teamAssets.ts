/**
 * Team Assets — Logos et drapeaux pour les équipes et joueurs
 *
 * Mappings des noms d'équipes/joueurs vers leurs logos/drapeaux.
 * Sources: api-sports.io, cdn.nba.com, flagcdn.com
 */

// ═══════════════════════════════════════════════════════════════
// FOOTBALL - LIGUE 1
// ═══════════════════════════════════════════════════════════════

const LIGUE_1_LOGOS: Record<string, string> = {
  'Paris Saint-Germain': 'https://media.api-sports.io/football/teams/85.png',
  'PSG': 'https://media.api-sports.io/football/teams/85.png',
  'Olympique de Marseille': 'https://media.api-sports.io/football/teams/81.png',
  'OM': 'https://media.api-sports.io/football/teams/81.png',
  'Marseille': 'https://media.api-sports.io/football/teams/81.png',
  'Olympique Lyonnais': 'https://media.api-sports.io/football/teams/80.png',
  'OL': 'https://media.api-sports.io/football/teams/80.png',
  'Lyon': 'https://media.api-sports.io/football/teams/80.png',
  'AS Monaco': 'https://media.api-sports.io/football/teams/91.png',
  'Monaco': 'https://media.api-sports.io/football/teams/91.png',
  'LOSC Lille': 'https://media.api-sports.io/football/teams/79.png',
  'Lille': 'https://media.api-sports.io/football/teams/79.png',
  'Stade Rennais': 'https://media.api-sports.io/football/teams/94.png',
  'Rennes': 'https://media.api-sports.io/football/teams/94.png',
  'OGC Nice': 'https://media.api-sports.io/football/teams/84.png',
  'Nice': 'https://media.api-sports.io/football/teams/84.png',
  'RC Lens': 'https://media.api-sports.io/football/teams/116.png',
  'Lens': 'https://media.api-sports.io/football/teams/116.png',
  'Stade Brestois': 'https://media.api-sports.io/football/teams/106.png',
  'Brest': 'https://media.api-sports.io/football/teams/106.png',
  'RC Strasbourg': 'https://media.api-sports.io/football/teams/95.png',
  'Strasbourg': 'https://media.api-sports.io/football/teams/95.png',
  'Toulouse FC': 'https://media.api-sports.io/football/teams/96.png',
  'Toulouse': 'https://media.api-sports.io/football/teams/96.png',
  'Montpellier HSC': 'https://media.api-sports.io/football/teams/82.png',
  'Montpellier': 'https://media.api-sports.io/football/teams/82.png',
  'FC Nantes': 'https://media.api-sports.io/football/teams/83.png',
  'Nantes': 'https://media.api-sports.io/football/teams/83.png',
  'Stade de Reims': 'https://media.api-sports.io/football/teams/93.png',
  'Reims': 'https://media.api-sports.io/football/teams/93.png',
  'Le Havre AC': 'https://media.api-sports.io/football/teams/112.png',
  'Le Havre': 'https://media.api-sports.io/football/teams/112.png',
  'FC Metz': 'https://media.api-sports.io/football/teams/114.png',
  'Metz': 'https://media.api-sports.io/football/teams/114.png',
  'Clermont Foot': 'https://media.api-sports.io/football/teams/108.png',
  'Clermont': 'https://media.api-sports.io/football/teams/108.png',
  'FC Lorient': 'https://media.api-sports.io/football/teams/97.png',
  'Lorient': 'https://media.api-sports.io/football/teams/97.png',
  'AJ Auxerre': 'https://media.api-sports.io/football/teams/98.png',
  'Auxerre': 'https://media.api-sports.io/football/teams/98.png',
  'Angers SCO': 'https://media.api-sports.io/football/teams/77.png',
  'Angers': 'https://media.api-sports.io/football/teams/77.png',
  'AS Saint-Étienne': 'https://media.api-sports.io/football/teams/1063.png',
  'Saint-Étienne': 'https://media.api-sports.io/football/teams/1063.png',
};

// ═══════════════════════════════════════════════════════════════
// FOOTBALL - PREMIER LEAGUE
// ═══════════════════════════════════════════════════════════════

const PREMIER_LEAGUE_LOGOS: Record<string, string> = {
  'Manchester City': 'https://media.api-sports.io/football/teams/50.png',
  'Man City': 'https://media.api-sports.io/football/teams/50.png',
  'Arsenal': 'https://media.api-sports.io/football/teams/42.png',
  'Liverpool': 'https://media.api-sports.io/football/teams/40.png',
  'Manchester United': 'https://media.api-sports.io/football/teams/33.png',
  'Man United': 'https://media.api-sports.io/football/teams/33.png',
  'Chelsea': 'https://media.api-sports.io/football/teams/49.png',
  'Tottenham Hotspur': 'https://media.api-sports.io/football/teams/47.png',
  'Tottenham': 'https://media.api-sports.io/football/teams/47.png',
  'Spurs': 'https://media.api-sports.io/football/teams/47.png',
  'Newcastle United': 'https://media.api-sports.io/football/teams/34.png',
  'Newcastle': 'https://media.api-sports.io/football/teams/34.png',
  'Aston Villa': 'https://media.api-sports.io/football/teams/66.png',
  'Brighton': 'https://media.api-sports.io/football/teams/51.png',
  'Brighton & Hove Albion': 'https://media.api-sports.io/football/teams/51.png',
  'West Ham United': 'https://media.api-sports.io/football/teams/48.png',
  'West Ham': 'https://media.api-sports.io/football/teams/48.png',
  'Brentford': 'https://media.api-sports.io/football/teams/55.png',
  'Crystal Palace': 'https://media.api-sports.io/football/teams/52.png',
  'Fulham': 'https://media.api-sports.io/football/teams/36.png',
  'Wolverhampton Wanderers': 'https://media.api-sports.io/football/teams/39.png',
  'Wolves': 'https://media.api-sports.io/football/teams/39.png',
  'Everton': 'https://media.api-sports.io/football/teams/45.png',
  'Nottingham Forest': 'https://media.api-sports.io/football/teams/65.png',
  'Bournemouth': 'https://media.api-sports.io/football/teams/35.png',
  'AFC Bournemouth': 'https://media.api-sports.io/football/teams/35.png',
  'Luton Town': 'https://media.api-sports.io/football/teams/1359.png',
  'Burnley': 'https://media.api-sports.io/football/teams/44.png',
  'Sheffield United': 'https://media.api-sports.io/football/teams/62.png',
  'Ipswich Town': 'https://media.api-sports.io/football/teams/57.png',
  'Leicester City': 'https://media.api-sports.io/football/teams/46.png',
  'Leicester': 'https://media.api-sports.io/football/teams/46.png',
  'Southampton': 'https://media.api-sports.io/football/teams/41.png',
};

// ═══════════════════════════════════════════════════════════════
// FOOTBALL - LA LIGA
// ═══════════════════════════════════════════════════════════════

const LA_LIGA_LOGOS: Record<string, string> = {
  'Real Madrid': 'https://media.api-sports.io/football/teams/541.png',
  'FC Barcelona': 'https://media.api-sports.io/football/teams/529.png',
  'Barcelona': 'https://media.api-sports.io/football/teams/529.png',
  'Atlético Madrid': 'https://media.api-sports.io/football/teams/530.png',
  'Atletico Madrid': 'https://media.api-sports.io/football/teams/530.png',
  'Sevilla FC': 'https://media.api-sports.io/football/teams/536.png',
  'Sevilla': 'https://media.api-sports.io/football/teams/536.png',
  'Real Sociedad': 'https://media.api-sports.io/football/teams/548.png',
  'Real Betis': 'https://media.api-sports.io/football/teams/543.png',
  'Betis': 'https://media.api-sports.io/football/teams/543.png',
  'Villarreal CF': 'https://media.api-sports.io/football/teams/533.png',
  'Villarreal': 'https://media.api-sports.io/football/teams/533.png',
  'Athletic Club': 'https://media.api-sports.io/football/teams/531.png',
  'Athletic Bilbao': 'https://media.api-sports.io/football/teams/531.png',
  'Valencia CF': 'https://media.api-sports.io/football/teams/532.png',
  'Valencia': 'https://media.api-sports.io/football/teams/532.png',
  'Osasuna': 'https://media.api-sports.io/football/teams/727.png',
  'CA Osasuna': 'https://media.api-sports.io/football/teams/727.png',
  'Celta Vigo': 'https://media.api-sports.io/football/teams/538.png',
  'RC Celta': 'https://media.api-sports.io/football/teams/538.png',
  'Rayo Vallecano': 'https://media.api-sports.io/football/teams/728.png',
  'Getafe CF': 'https://media.api-sports.io/football/teams/546.png',
  'Getafe': 'https://media.api-sports.io/football/teams/546.png',
  'Girona FC': 'https://media.api-sports.io/football/teams/547.png',
  'Girona': 'https://media.api-sports.io/football/teams/547.png',
  'UD Almería': 'https://media.api-sports.io/football/teams/723.png',
  'Almería': 'https://media.api-sports.io/football/teams/723.png',
  'Cádiz CF': 'https://media.api-sports.io/football/teams/724.png',
  'Cádiz': 'https://media.api-sports.io/football/teams/724.png',
  'RCD Mallorca': 'https://media.api-sports.io/football/teams/798.png',
  'Mallorca': 'https://media.api-sports.io/football/teams/798.png',
  'UD Las Palmas': 'https://media.api-sports.io/football/teams/534.png',
  'Las Palmas': 'https://media.api-sports.io/football/teams/534.png',
  'Deportivo Alavés': 'https://media.api-sports.io/football/teams/542.png',
  'Alavés': 'https://media.api-sports.io/football/teams/542.png',
  'Granada CF': 'https://media.api-sports.io/football/teams/715.png',
  'Granada': 'https://media.api-sports.io/football/teams/715.png',
  'RCD Espanyol': 'https://media.api-sports.io/football/teams/540.png',
  'Espanyol': 'https://media.api-sports.io/football/teams/540.png',
};

// ═══════════════════════════════════════════════════════════════
// FOOTBALL - BUNDESLIGA
// ═══════════════════════════════════════════════════════════════

const BUNDESLIGA_LOGOS: Record<string, string> = {
  'Bayern Munich': 'https://media.api-sports.io/football/teams/157.png',
  'FC Bayern München': 'https://media.api-sports.io/football/teams/157.png',
  'Bayern München': 'https://media.api-sports.io/football/teams/157.png',
  'Borussia Dortmund': 'https://media.api-sports.io/football/teams/165.png',
  'Dortmund': 'https://media.api-sports.io/football/teams/165.png',
  'BVB': 'https://media.api-sports.io/football/teams/165.png',
  'RB Leipzig': 'https://media.api-sports.io/football/teams/173.png',
  'Leipzig': 'https://media.api-sports.io/football/teams/173.png',
  'Bayer Leverkusen': 'https://media.api-sports.io/football/teams/168.png',
  'Leverkusen': 'https://media.api-sports.io/football/teams/168.png',
  'Eintracht Frankfurt': 'https://media.api-sports.io/football/teams/169.png',
  'Frankfurt': 'https://media.api-sports.io/football/teams/169.png',
  'VfL Wolfsburg': 'https://media.api-sports.io/football/teams/161.png',
  'Wolfsburg': 'https://media.api-sports.io/football/teams/161.png',
  'Borussia Mönchengladbach': 'https://media.api-sports.io/football/teams/163.png',
  'Mönchengladbach': 'https://media.api-sports.io/football/teams/163.png',
  "Gladbach": 'https://media.api-sports.io/football/teams/163.png',
  'SC Freiburg': 'https://media.api-sports.io/football/teams/160.png',
  'Freiburg': 'https://media.api-sports.io/football/teams/160.png',
  '1. FC Köln': 'https://media.api-sports.io/football/teams/192.png',
  'Köln': 'https://media.api-sports.io/football/teams/192.png',
  'FC Union Berlin': 'https://media.api-sports.io/football/teams/182.png',
  'Union Berlin': 'https://media.api-sports.io/football/teams/182.png',
  'TSG Hoffenheim': 'https://media.api-sports.io/football/teams/167.png',
  'Hoffenheim': 'https://media.api-sports.io/football/teams/167.png',
  'VfB Stuttgart': 'https://media.api-sports.io/football/teams/172.png',
  'Stuttgart': 'https://media.api-sports.io/football/teams/172.png',
  'Werder Bremen': 'https://media.api-sports.io/football/teams/162.png',
  'Bremen': 'https://media.api-sports.io/football/teams/162.png',
  'FC Augsburg': 'https://media.api-sports.io/football/teams/170.png',
  'Augsburg': 'https://media.api-sports.io/football/teams/170.png',
  'VfL Bochum': 'https://media.api-sports.io/football/teams/176.png',
  'Bochum': 'https://media.api-sports.io/football/teams/176.png',
  'FSV Mainz 05': 'https://media.api-sports.io/football/teams/164.png',
  'Mainz': 'https://media.api-sports.io/football/teams/164.png',
  '1. FC Heidenheim': 'https://media.api-sports.io/football/teams/180.png',
  'Heidenheim': 'https://media.api-sports.io/football/teams/180.png',
  'SV Darmstadt 98': 'https://media.api-sports.io/football/teams/181.png',
  'Darmstadt': 'https://media.api-sports.io/football/teams/181.png',
};

// ═══════════════════════════════════════════════════════════════
// FOOTBALL - SERIE A
// ═══════════════════════════════════════════════════════════════

const SERIE_A_LOGOS: Record<string, string> = {
  'Inter Milan': 'https://media.api-sports.io/football/teams/505.png',
  'FC Internazionale': 'https://media.api-sports.io/football/teams/505.png',
  'Inter': 'https://media.api-sports.io/football/teams/505.png',
  'AC Milan': 'https://media.api-sports.io/football/teams/489.png',
  'Milan': 'https://media.api-sports.io/football/teams/489.png',
  'Juventus': 'https://media.api-sports.io/football/teams/496.png',
  'SSC Napoli': 'https://media.api-sports.io/football/teams/492.png',
  'Napoli': 'https://media.api-sports.io/football/teams/492.png',
  'AS Roma': 'https://media.api-sports.io/football/teams/497.png',
  'Roma': 'https://media.api-sports.io/football/teams/497.png',
  'SS Lazio': 'https://media.api-sports.io/football/teams/487.png',
  'Lazio': 'https://media.api-sports.io/football/teams/487.png',
  'Atalanta BC': 'https://media.api-sports.io/football/teams/499.png',
  'Atalanta': 'https://media.api-sports.io/football/teams/499.png',
  'ACF Fiorentina': 'https://media.api-sports.io/football/teams/502.png',
  'Fiorentina': 'https://media.api-sports.io/football/teams/502.png',
  'Torino FC': 'https://media.api-sports.io/football/teams/503.png',
  'Torino': 'https://media.api-sports.io/football/teams/503.png',
  'Bologna FC': 'https://media.api-sports.io/football/teams/500.png',
  'Bologna': 'https://media.api-sports.io/football/teams/500.png',
  'US Sassuolo': 'https://media.api-sports.io/football/teams/488.png',
  'Sassuolo': 'https://media.api-sports.io/football/teams/488.png',
  'Udinese Calcio': 'https://media.api-sports.io/football/teams/494.png',
  'Udinese': 'https://media.api-sports.io/football/teams/494.png',
  'Hellas Verona': 'https://media.api-sports.io/football/teams/504.png',
  'Verona': 'https://media.api-sports.io/football/teams/504.png',
  'Empoli FC': 'https://media.api-sports.io/football/teams/511.png',
  'Empoli': 'https://media.api-sports.io/football/teams/511.png',
  'US Lecce': 'https://media.api-sports.io/football/teams/867.png',
  'Lecce': 'https://media.api-sports.io/football/teams/867.png',
  'Cagliari Calcio': 'https://media.api-sports.io/football/teams/490.png',
  'Cagliari': 'https://media.api-sports.io/football/teams/490.png',
  'Genoa CFC': 'https://media.api-sports.io/football/teams/495.png',
  'Genoa': 'https://media.api-sports.io/football/teams/495.png',
  'Frosinone Calcio': 'https://media.api-sports.io/football/teams/512.png',
  'Frosinone': 'https://media.api-sports.io/football/teams/512.png',
  'US Salernitana': 'https://media.api-sports.io/football/teams/514.png',
  'Salernitana': 'https://media.api-sports.io/football/teams/514.png',
  'AC Monza': 'https://media.api-sports.io/football/teams/1579.png',
  'Monza': 'https://media.api-sports.io/football/teams/1579.png',
  'Venezia FC': 'https://media.api-sports.io/football/teams/517.png',
  'Venezia': 'https://media.api-sports.io/football/teams/517.png',
  'Parma Calcio': 'https://media.api-sports.io/football/teams/523.png',
  'Parma': 'https://media.api-sports.io/football/teams/523.png',
  'Como 1907': 'https://media.api-sports.io/football/teams/520.png',
  'Como': 'https://media.api-sports.io/football/teams/520.png',
};

// ═══════════════════════════════════════════════════════════════
// FOOTBALL - CHAMPIONS LEAGUE / UEFA
// ═══════════════════════════════════════════════════════════════

const UEFA_LOGOS: Record<string, string> = {
  'Manchester City': 'https://media.api-sports.io/football/teams/50.png',
  'Real Madrid': 'https://media.api-sports.io/football/teams/541.png',
  'Bayern Munich': 'https://media.api-sports.io/football/teams/157.png',
  'Paris Saint-Germain': 'https://media.api-sports.io/football/teams/85.png',
  'Inter Milan': 'https://media.api-sports.io/football/teams/505.png',
  'Borussia Dortmund': 'https://media.api-sports.io/football/teams/165.png',
  'FC Barcelona': 'https://media.api-sports.io/football/teams/529.png',
  'Atlético Madrid': 'https://media.api-sports.io/football/teams/530.png',
  'Benfica': 'https://media.api-sports.io/football/teams/211.png',
  'SL Benfica': 'https://media.api-sports.io/football/teams/211.png',
  'FC Porto': 'https://media.api-sports.io/football/teams/212.png',
  'Porto': 'https://media.api-sports.io/football/teams/212.png',
  'Sporting CP': 'https://media.api-sports.io/football/teams/228.png',
  'Sporting Lisbon': 'https://media.api-sports.io/football/teams/228.png',
  'Ajax Amsterdam': 'https://media.api-sports.io/football/teams/194.png',
  'Ajax': 'https://media.api-sports.io/football/teams/194.png',
  'PSV Eindhoven': 'https://media.api-sports.io/football/teams/197.png',
  'PSV': 'https://media.api-sports.io/football/teams/197.png',
  'Feyenoord': 'https://media.api-sports.io/football/teams/198.png',
  'Red Bull Salzburg': 'https://media.api-sports.io/football/teams/571.png',
  'Salzburg': 'https://media.api-sports.io/football/teams/571.png',
  'Shakhtar Donetsk': 'https://media.api-sports.io/football/teams/592.png',
  'Dynamo Kyiv': 'https://media.api-sports.io/football/teams/594.png',
  'Celtic': 'https://media.api-sports.io/football/teams/247.png',
  'Celtic FC': 'https://media.api-sports.io/football/teams/247.png',
  'Rangers': 'https://media.api-sports.io/football/teams/257.png',
  'Rangers FC': 'https://media.api-sports.io/football/teams/257.png',
  'Club Brugge': 'https://media.api-sports.io/football/teams/569.png',
  'Galatasaray': 'https://media.api-sports.io/football/teams/645.png',
  'Fenerbahçe': 'https://media.api-sports.io/football/teams/611.png',
  'Besiktas': 'https://media.api-sports.io/football/teams/549.png',
};

// ═══════════════════════════════════════════════════════════════
// BASKETBALL - NBA
// ═══════════════════════════════════════════════════════════════

export const NBA_LOGOS: Record<string, string> = {
  // Eastern Conference - Atlantic
  'Boston Celtics': 'https://media.api-sports.io/basketball/teams/133.png',
  'Celtics': 'https://media.api-sports.io/basketball/teams/133.png',
  'Brooklyn Nets': 'https://media.api-sports.io/basketball/teams/134.png',
  'Nets': 'https://media.api-sports.io/basketball/teams/134.png',
  'New York Knicks': 'https://media.api-sports.io/basketball/teams/138.png',
  'Knicks': 'https://media.api-sports.io/basketball/teams/138.png',
  'Philadelphia 76ers': 'https://media.api-sports.io/basketball/teams/143.png',
  '76ers': 'https://media.api-sports.io/basketball/teams/143.png',
  'Sixers': 'https://media.api-sports.io/basketball/teams/143.png',
  'Toronto Raptors': 'https://media.api-sports.io/basketball/teams/149.png',
  'Raptors': 'https://media.api-sports.io/basketball/teams/149.png',
  // Eastern Conference - Central
  'Chicago Bulls': 'https://media.api-sports.io/basketball/teams/135.png',
  'Bulls': 'https://media.api-sports.io/basketball/teams/135.png',
  'Cleveland Cavaliers': 'https://media.api-sports.io/basketball/teams/136.png',
  'Cavaliers': 'https://media.api-sports.io/basketball/teams/136.png',
  'Cavs': 'https://media.api-sports.io/basketball/teams/136.png',
  'Detroit Pistons': 'https://media.api-sports.io/basketball/teams/137.png',
  'Pistons': 'https://media.api-sports.io/basketball/teams/137.png',
  'Indiana Pacers': 'https://media.api-sports.io/basketball/teams/139.png',
  'Pacers': 'https://media.api-sports.io/basketball/teams/139.png',
  'Milwaukee Bucks': 'https://media.api-sports.io/basketball/teams/140.png',
  'Bucks': 'https://media.api-sports.io/basketball/teams/140.png',
  // Eastern Conference - Southeast
  'Atlanta Hawks': 'https://media.api-sports.io/basketball/teams/132.png',
  'Hawks': 'https://media.api-sports.io/basketball/teams/132.png',
  'Charlotte Hornets': 'https://media.api-sports.io/basketball/teams/144.png',
  'Hornets': 'https://media.api-sports.io/basketball/teams/144.png',
  'Miami Heat': 'https://media.api-sports.io/basketball/teams/141.png',
  'Heat': 'https://media.api-sports.io/basketball/teams/141.png',
  'Orlando Magic': 'https://media.api-sports.io/basketball/teams/142.png',
  'Magic': 'https://media.api-sports.io/basketball/teams/142.png',
  'Washington Wizards': 'https://media.api-sports.io/basketball/teams/150.png',
  'Wizards': 'https://media.api-sports.io/basketball/teams/150.png',
  // Western Conference - Northwest
  'Denver Nuggets': 'https://media.api-sports.io/basketball/teams/151.png',
  'Nuggets': 'https://media.api-sports.io/basketball/teams/151.png',
  'Minnesota Timberwolves': 'https://media.api-sports.io/basketball/teams/152.png',
  'Timberwolves': 'https://media.api-sports.io/basketball/teams/152.png',
  'Oklahoma City Thunder': 'https://media.api-sports.io/basketball/teams/153.png',
  'Thunder': 'https://media.api-sports.io/basketball/teams/153.png',
  'OKC Thunder': 'https://media.api-sports.io/basketball/teams/153.png',
  'Portland Trail Blazers': 'https://media.api-sports.io/basketball/teams/154.png',
  'Trail Blazers': 'https://media.api-sports.io/basketball/teams/154.png',
  'Blazers': 'https://media.api-sports.io/basketball/teams/154.png',
  'Utah Jazz': 'https://media.api-sports.io/basketball/teams/155.png',
  'Jazz': 'https://media.api-sports.io/basketball/teams/155.png',
  // Western Conference - Pacific
  'Golden State Warriors': 'https://media.api-sports.io/basketball/teams/145.png',
  'Warriors': 'https://media.api-sports.io/basketball/teams/145.png',
  'Los Angeles Clippers': 'https://media.api-sports.io/basketball/teams/146.png',
  'Clippers': 'https://media.api-sports.io/basketball/teams/146.png',
  'LA Clippers': 'https://media.api-sports.io/basketball/teams/146.png',
  'Los Angeles Lakers': 'https://media.api-sports.io/basketball/teams/147.png',
  'Lakers': 'https://media.api-sports.io/basketball/teams/147.png',
  'LA Lakers': 'https://media.api-sports.io/basketball/teams/147.png',
  'Phoenix Suns': 'https://media.api-sports.io/basketball/teams/148.png',
  'Suns': 'https://media.api-sports.io/basketball/teams/148.png',
  'Sacramento Kings': 'https://media.api-sports.io/basketball/teams/156.png',
  'Kings': 'https://media.api-sports.io/basketball/teams/156.png',
  // Western Conference - Southwest
  'Dallas Mavericks': 'https://media.api-sports.io/basketball/teams/157.png',
  'Mavericks': 'https://media.api-sports.io/basketball/teams/157.png',
  'Mavs': 'https://media.api-sports.io/basketball/teams/157.png',
  'Houston Rockets': 'https://media.api-sports.io/basketball/teams/158.png',
  'Rockets': 'https://media.api-sports.io/basketball/teams/158.png',
  'Memphis Grizzlies': 'https://media.api-sports.io/basketball/teams/159.png',
  'Grizzlies': 'https://media.api-sports.io/basketball/teams/159.png',
  'New Orleans Pelicans': 'https://media.api-sports.io/basketball/teams/160.png',
  'Pelicans': 'https://media.api-sports.io/basketball/teams/160.png',
  'San Antonio Spurs': 'https://media.api-sports.io/basketball/teams/161.png',
  'Spurs': 'https://media.api-sports.io/basketball/teams/161.png',
};

// ═══════════════════════════════════════════════════════════════
// BASKETBALL - EUROLEAGUE
// ═══════════════════════════════════════════════════════════════

export const EUROLEAGUE_LOGOS: Record<string, string> = {
  'Olympiacos BC': 'https://media.api-sports.io/basketball/teams/2541.png',
  'Olympiacos': 'https://media.api-sports.io/basketball/teams/2541.png',
  'Panathinaikos BC': 'https://media.api-sports.io/basketball/teams/2542.png',
  'Panathinaikos': 'https://media.api-sports.io/basketball/teams/2542.png',
  'Real Madrid Baloncesto': 'https://media.api-sports.io/basketball/teams/2543.png',
  'Real Madrid Basketball': 'https://media.api-sports.io/basketball/teams/2543.png',
  'FC Barcelona Basket': 'https://media.api-sports.io/basketball/teams/2544.png',
  'Barcelona Basketball': 'https://media.api-sports.io/basketball/teams/2544.png',
  'Fenerbahçe Basketball': 'https://media.api-sports.io/basketball/teams/2545.png',
  'Fenerbahce Beko': 'https://media.api-sports.io/basketball/teams/2545.png',
  'Anadolu Efes': 'https://media.api-sports.io/basketball/teams/2546.png',
  'CSKA Moscow': 'https://media.api-sports.io/basketball/teams/2547.png',
  'Maccabi Tel Aviv': 'https://media.api-sports.io/basketball/teams/2548.png',
  'Bayern Munich Basketball': 'https://media.api-sports.io/basketball/teams/2549.png',
  'FC Bayern Basketball': 'https://media.api-sports.io/basketball/teams/2549.png',
  'Virtus Bologna': 'https://media.api-sports.io/basketball/teams/2550.png',
  'EA7 Emporio Armani Milano': 'https://media.api-sports.io/basketball/teams/2551.png',
  'Olimpia Milano': 'https://media.api-sports.io/basketball/teams/2551.png',
  'Partizan Belgrade': 'https://media.api-sports.io/basketball/teams/2552.png',
  'Partizan': 'https://media.api-sports.io/basketball/teams/2552.png',
  'Crvena Zvezda': 'https://media.api-sports.io/basketball/teams/2553.png',
  'Red Star Belgrade': 'https://media.api-sports.io/basketball/teams/2553.png',
  'LDLC ASVEL': 'https://media.api-sports.io/basketball/teams/2554.png',
  'ASVEL Lyon-Villeurbanne': 'https://media.api-sports.io/basketball/teams/2554.png',
  'Monaco Basketball': 'https://media.api-sports.io/basketball/teams/2555.png',
  'AS Monaco Basket': 'https://media.api-sports.io/basketball/teams/2555.png',
  'Alba Berlin': 'https://media.api-sports.io/basketball/teams/2556.png',
  'Zalgiris Kaunas': 'https://media.api-sports.io/basketball/teams/2557.png',
  'Baskonia': 'https://media.api-sports.io/basketball/teams/2558.png',
  'Saski Baskonia': 'https://media.api-sports.io/basketball/teams/2558.png',
};

// ═══════════════════════════════════════════════════════════════
// TENNIS - FLAGS (Top 50 ATP + Top 30 WTA)
// ═══════════════════════════════════════════════════════════════

export const TENNIS_FLAGS: Record<string, string> = {
  // ATP Top 50
  'Jannik Sinner': 'it',
  'Novak Djokovic': 'rs',
  'Carlos Alcaraz': 'es',
  'Daniil Medvedev': 'ru',
  'Alexander Zverev': 'de',
  'Andrey Rublev': 'ru',
  'Holger Rune': 'dk',
  'Hubert Hurkacz': 'pl',
  'Casper Ruud': 'no',
  'Taylor Fritz': 'us',
  'Grigor Dimitrov': 'bg',
  'Alex de Minaur': 'au',
  'Stefanos Tsitsipas': 'gr',
  'Tommy Paul': 'us',
  'Ben Shelton': 'us',
  'Frances Tiafoe': 'us',
  'Sebastian Korda': 'us',
  'Karen Khachanov': 'ru',
  'Ugo Humbert': 'fr',
  'Nicolas Jarry': 'cl',
  'Felix Auger-Aliassime': 'ca',
  'Lorenzo Musetti': 'it',
  'Jan-Lennard Struff': 'de',
  'Alexander Bublik': 'kz',
  'Tallon Griekspoor': 'nl',
  'Adrian Mannarino': 'fr',
  'Alejandro Tabilo': 'cl',
  'Francisco Cerundolo': 'ar',
  'Arthur Fils': 'fr',
  'Jack Draper': 'gb',
  'Cameron Norrie': 'gb',
  'Tomas Machac': 'cz',
  'Jiri Lehecka': 'cz',
  'Lorenzo Sonego': 'it',
  'Matteo Arnaldi': 'it',
  'Sebastian Baez': 'ar',
  'Zhizhen Zhang': 'cn',
  'Mariano Navone': 'ar',
  'Giovanni Mpetshi Perricard': 'fr',
  'Fabian Marozsan': 'hu',
  'Alexei Popyrin': 'au',
  'Denis Shapovalov': 'ca',
  'Flavio Cobolli': 'it',
  'Luciano Darderi': 'it',
  'Jordan Thompson': 'au',
  'Miomir Kecmanovic': 'rs',
  'Gael Monfils': 'fr',
  'Andy Murray': 'gb',
  'Rafael Nadal': 'es',
  'Stan Wawrinka': 'ch',
  // WTA Top 30
  'Iga Swiatek': 'pl',
  'Aryna Sabalenka': 'by',
  'Coco Gauff': 'us',
  'Elena Rybakina': 'kz',
  'Jessica Pegula': 'us',
  'Jasmine Paolini': 'it',
  'Qinwen Zheng': 'cn',
  'Maria Sakkari': 'gr',
  'Emma Navarro': 'us',
  'Daria Kasatkina': 'ru',
  'Barbora Krejcikova': 'cz',
  'Jelena Ostapenko': 'lv',
  'Danielle Collins': 'us',
  'Beatriz Haddad Maia': 'br',
  'Anna Kalinskaya': 'ru',
  'Madison Keys': 'us',
  'Donna Vekic': 'hr',
  'Mirra Andreeva': 'ru',
  'Diana Shnaider': 'ru',
  'Marta Kostyuk': 'ua',
  'Ekaterina Alexandrova': 'ru',
  'Paula Badosa': 'es',
  'Victoria Azarenka': 'by',
  'Liudmila Samsonova': 'ru',
  'Leylah Fernandez': 'ca',
  'Yulia Putintseva': 'kz',
  'Katie Boulter': 'gb',
  'Caroline Garcia': 'fr',
  'Amanda Anisimova': 'us',
  'Karolina Muchova': 'cz',
};

// ═══════════════════════════════════════════════════════════════
// COMBINED FOOTBALL LOGOS
// ═══════════════════════════════════════════════════════════════

export const FOOTBALL_LOGOS: Record<string, string> = {
  ...LIGUE_1_LOGOS,
  ...PREMIER_LEAGUE_LOGOS,
  ...LA_LIGA_LOGOS,
  ...BUNDESLIGA_LOGOS,
  ...SERIE_A_LOGOS,
  ...UEFA_LOGOS,
};

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Get team logo URL by team name and sport code
 */
export function getTeamLogo(teamName: string, sportCode: string): string | null {
  const normalizedName = teamName.trim();

  if (sportCode === 'FOOTBALL' || sportCode === 'SOCCER') {
    return FOOTBALL_LOGOS[normalizedName] || null;
  }

  if (sportCode === 'BASKETBALL') {
    return NBA_LOGOS[normalizedName] || EUROLEAGUE_LOGOS[normalizedName] || null;
  }

  return null;
}

/**
 * Get tennis player flag URL by player name
 */
export function getTennisFlag(playerName: string): string | null {
  const normalizedName = playerName.trim();
  const countryCode = TENNIS_FLAGS[normalizedName];

  if (countryCode) {
    return `https://flagcdn.com/w80/${countryCode}.png`;
  }

  return null;
}

/**
 * Check if a sport uses player flags instead of team logos
 */
export function usesPlayerFlags(sportCode: string): boolean {
  return sportCode === 'TENNIS';
}

/**
 * Get asset URL (logo or flag) for a team/player
 */
export function getTeamAsset(name: string, sportCode: string): string | null {
  if (usesPlayerFlags(sportCode)) {
    return getTennisFlag(name);
  }
  return getTeamLogo(name, sportCode);
}
