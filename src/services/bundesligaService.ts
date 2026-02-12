import type { CachePayload, Match } from '../types';

export const CACHE_KEY = 'bundesliga_results_cache';
const API_URL = 'https://api.openligadb.de/getmatchdata/bl1/2024';

type OpenLigaResponse = {
  MatchID: number;
  MatchDateTime: string;
  Group?: { GroupOrderID?: number };
  Team1: { TeamName: string };
  Team2: { TeamName: string };
  MatchResults?: Array<{ ResultTypeID: number; PointsTeam1: number; PointsTeam2: number }>;
};

const mapMatch = (item: OpenLigaResponse): Match | null => {
  const finalResult = item.MatchResults?.find((result) => result.ResultTypeID === 2);
  if (!finalResult || !item.Group?.GroupOrderID) {
    return null;
  }

  return {
    matchId: item.MatchID,
    spieltag: item.Group.GroupOrderID,
    date: item.MatchDateTime,
    teamA: item.Team1.TeamName,
    teamB: item.Team2.TeamName,
    scoreA: finalResult.PointsTeam1,
    scoreB: finalResult.PointsTeam2
  };
};

export const loadCache = (): CachePayload | null => {
  const raw = localStorage.getItem(CACHE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as CachePayload;
    if (!Array.isArray(parsed.matches)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const saveCache = (payload: CachePayload): void => {
  localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
};

export const fetchBundesligaResults = async (): Promise<CachePayload> => {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error('Daten konnten nicht geladen werden.');
  }

  const data = (await response.json()) as OpenLigaResponse[];
  const matches = data.map(mapMatch).filter((match): match is Match => Boolean(match));

  return {
    season: '2024/2025',
    updatedAt: new Date().toISOString(),
    matches
  };
};
