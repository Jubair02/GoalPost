/** Static image assets served from public/assets (see also public/assets/*). */
const base = import.meta.env.BASE_URL;

export const IMG = {
  wc2026: `${base}assets/fifa1.webp`, // FIFA World Cup 2026 official-guide cover
  wcAction: `${base}assets/fifa2.avif`, // World Cup action
  messi: `${base}assets/fifa3.webp`, // Messi celebrating (Argentina)
  neuer: `${base}assets/fifa4.jpg`, // Manuel Neuer (Germany)
  neymar: `${base}assets/fifa5.webp`, // Neymar (Brazil)
  mbappe: `${base}assets/fifa6.jpg`, // Mbappé (France)
  clash: `${base}assets/fifa7.jpg`, // Del Piero vs Ronaldo — the classic handshake
  barca: `${base}assets/barca.jpg`, // Barcelona squad
  madrid: `${base}assets/madrid.jpg`, // Real Madrid lifting a trophy
  maldini: `${base}assets/maldini.jpg`, // Paolo Maldini (AC Milan)
  legends: `${base}assets/legends.jpg`, // Legends collage
  stadium: `${base}assets/stadium.jpg`, // Packed stadium interior
  loginHero: `${base}assets/login-hero.jpg`, // Painted collage of football legends — login backdrop

  // League/section artwork for Career categories.
  laliga: `${base}assets/laliga.webp`, // El Clásico action
  bundesliga: `${base}assets/bundesliga.jpg`, // Bundesliga crest on the pitch
  serieA: `${base}assets/serie-a.avif`, // Serie A
  footballRules: `${base}assets/football-rules.jpg`, // Referee shows a red card
  premierLeague: `${base}assets/Premier_league.webp`, // Premier League
  footballTrivia: `${base}assets/football_trivia.jpg`, // Football trivia
  guessClub: `${base}assets/Guess_the_club.jpg`, // Guess the Club
  guessPlayer: `${base}assets/guess_the_player.jpg`, // Guess the Player
  uefaEuro: `${base}assets/Uefa_euro.jpg`, // UEFA Euro
  copaAmerica: `${base}assets/copa.jpeg`, // Copa América
  nationalTeam: `${base}assets/national_team.jpg`, // National teams
  ballonDor: `${base}assets/ballon_dor.webp`, // Ballon d'Or
  iconicMoment: `${base}assets/Iconic_moment.avif`, // Iconic moments
} as const;

/** Legend portraits used as achievement badge medallions. */
export const BADGE = {
  ronaldinho: `${base}assets/badge/3300.webp`,
  cr7: `${base}assets/badge/8198-1748102259.webp`,
  ronaldo: `${base}assets/badge/ronaldo-nazario.jpg`,
  messi: `${base}assets/badge/messhi.jpg`,
  neymar: `${base}assets/badge/ney.jpg`,
} as const;
