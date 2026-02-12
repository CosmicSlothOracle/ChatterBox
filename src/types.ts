export type Match = {
  matchId: number;
  spieltag: number;
  date: string;
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
};

export type MatchdayGroup = {
  spieltag: number;
  dateLabel: string;
  matches: Match[];
};

export type CachePayload = {
  updatedAt: string;
  season: string;
  matches: Match[];
};
