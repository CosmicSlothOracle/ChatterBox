const TEAMS = [
  'FC Bayern München',
  'Borussia Dortmund',
  'RB Leipzig',
  'Bayer 04 Leverkusen',
  'VfB Stuttgart',
  'Eintracht Frankfurt',
  'TSG Hoffenheim',
  'SC Freiburg',
  '1. FC Union Berlin',
  'VfL Wolfsburg',
  'Borussia Mönchengladbach',
  'Werder Bremen',
  '1. FSV Mainz 05',
  'FC Augsburg',
  '1. FC Heidenheim',
  'VfL Bochum',
  'FC St. Pauli',
  'Holstein Kiel'
];

const createFallbackMatches = (matchdays = 20) => {
  const matches = [];
  const kickoff = new Date('2024-08-23T20:30:00Z').getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  let matchId = 1;

  for (let spieltag = 1; spieltag <= matchdays; spieltag += 1) {
    for (let slot = 0; slot < 9; slot += 1) {
      const homeIndex = (spieltag * 2 + slot * 3) % TEAMS.length;
      const awayIndex = (spieltag * 5 + slot * 4 + 7) % TEAMS.length;
      const teamA = TEAMS[homeIndex];
      const teamB = TEAMS[awayIndex === homeIndex ? (awayIndex + 1) % TEAMS.length : awayIndex];

      matches.push({
        matchId: matchId++,
        spieltag,
        date: new Date(kickoff + (spieltag - 1) * 7 * dayMs + slot * 6 * 60 * 60 * 1000).toISOString(),
        teamA,
        teamB,
        scoreA: (spieltag + slot + homeIndex) % 5,
        scoreB: (spieltag * 2 + slot + awayIndex) % 4
      });
    }
  }

  return matches;
};

export const fallbackPayload = {
  season: '2024/2025',
  updatedAt: '2025-05-18T18:00:00.000Z',
  matches: createFallbackMatches(20)
export const fallbackPayload = {
  season: '2024/2025',
  updatedAt: '2025-05-18T18:00:00.000Z',
  matches: [
    { matchId: 1, spieltag: 1, date: '2024-08-23T20:30:00Z', teamA: 'Borussia Mönchengladbach', teamB: 'Bayer 04 Leverkusen', scoreA: 2, scoreB: 3 },
    { matchId: 2, spieltag: 1, date: '2024-08-24T15:30:00Z', teamA: 'FC Bayern München', teamB: 'VfL Wolfsburg', scoreA: 4, scoreB: 1 },
    { matchId: 3, spieltag: 1, date: '2024-08-24T18:30:00Z', teamA: 'Borussia Dortmund', teamB: 'Eintracht Frankfurt', scoreA: 2, scoreB: 1 },
    { matchId: 4, spieltag: 2, date: '2024-08-30T20:30:00Z', teamA: 'RB Leipzig', teamB: '1. FC Union Berlin', scoreA: 1, scoreB: 1 },
    { matchId: 5, spieltag: 2, date: '2024-08-31T15:30:00Z', teamA: 'SC Freiburg', teamB: 'VfB Stuttgart', scoreA: 0, scoreB: 2 },
    { matchId: 6, spieltag: 2, date: '2024-08-31T18:30:00Z', teamA: 'Werder Bremen', teamB: 'TSG Hoffenheim', scoreA: 3, scoreB: 2 }
  ]
};
