export const CACHE_KEY = 'bundesliga_results_cache';
const API_URL = 'https://api.openligadb.de/getmatchdata/bl1/2024';

const toMatch = (item) => {
  const results = item.MatchResults ?? [];
  const finalResult = results.find((result) => result.ResultTypeID === 2) ?? results[results.length - 1];
  const finalResult = item.MatchResults?.find((result) => result.ResultTypeID === 2);
  const spieltag = item.Group?.GroupOrderID;
  if (!finalResult || !spieltag) return null;

  return {
    matchId: item.MatchID,
    spieltag,
    date: item.MatchDateTime,
    teamA: item.Team1.TeamName,
    teamB: item.Team2.TeamName,
    scoreA: finalResult.PointsTeam1,
    scoreB: finalResult.PointsTeam2
  };
};

export const loadCache = () => {
  const raw = localStorage.getItem(CACHE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.matches)) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const saveCache = (payload) => {
  localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
};

export const fetchBundesligaResults = async () => {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error('Daten konnten nicht geladen werden.');
  }

  const rawMatches = await response.json();
  const matches = rawMatches.map(toMatch).filter(Boolean);

  return {
    season: '2024/2025',
    updatedAt: new Date().toISOString(),
    matches
  };
};
