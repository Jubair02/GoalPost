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
} as const;
