import { useEffect, useMemo, useState } from 'react';
import ExportSection from './ExportSection';
import MatchCard from './MatchCard';
import { fetchBundesligaResults, loadCache, saveCache } from './services/bundesligaService';
import type { MatchdayGroup } from './types';

const formatTimestamp = (iso?: string): string => {
  if (!iso) return 'Noch nie';
  return new Date(iso).toLocaleString('de-DE');
};

export default function App() {
  const [groups, setGroups] = useState<MatchdayGroup[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const allMatchdays = useMemo(() => groups.map((group) => group.spieltag), [groups]);

  const processData = (matches: Parameters<typeof buildGroups>[0]): MatchdayGroup[] => buildGroups(matches);

  const bootstrap = async (): Promise<void> => {
    const cache = loadCache();
    if (cache) {
      const grouped = processData(cache.matches);
      setGroups(grouped);
      setSelected(grouped.map((entry) => entry.spieltag));
      setLastUpdated(cache.updatedAt);
    }

    try {
      setLoading(true);
      setError('');
      const fresh = await fetchBundesligaResults();
      saveCache(fresh);
      const grouped = processData(fresh.matches);
      setGroups(grouped);
      setSelected((current) => (current.length ? current : grouped.map((entry) => entry.spieltag)));
      setLastUpdated(fresh.updatedAt);
    } catch {
      if (!cache) {
        setError('Daten konnten nicht geladen werden und es liegt kein Cache vor.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void bootstrap();
  }, []);

  const toggleMatchday = (spieltag: number): void => {
    setSelected((current) =>
      current.includes(spieltag) ? current.filter((day) => day !== spieltag) : [...current, spieltag].sort((a, b) => a - b)
    );
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="badge">Bundesliga Dashboard</p>
          <h1>1. Bundesliga – Ergebnisse nach Spieltag</h1>
          <p className="sub">Zuletzt aktualisiert: {formatTimestamp(lastUpdated)}</p>
        </div>
        <button type="button" className="refresh" onClick={() => void bootstrap()} disabled={loading}>
          {loading ? 'Aktualisiere…' : '🔄 Aktualisieren'}
        </button>
      </header>

      <section className="controls">
        <div className="controls-head">
          <h2>Spieltage auswählen</h2>
          <div className="bulk-actions">
            <button type="button" onClick={() => setSelected(allMatchdays)}>
              Alle auswählen
            </button>
            <button type="button" onClick={() => setSelected([])}>
              Auswahl aufheben
            </button>
          </div>
        </div>
        <div className="checkbox-grid">
          {groups.map((group) => {
            const active = selected.includes(group.spieltag);
            return (
              <label key={group.spieltag} className={`day-chip ${active ? 'active' : ''}`}>
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => toggleMatchday(group.spieltag)}
                />
                Spieltag {group.spieltag}
              </label>
            );
          })}
        </div>
      </section>

      <ExportSection selectedMatchdays={selected} groupedData={groups} />

      {error ? <p className="error">{error}</p> : null}

      <section className="matchdays">
        {groups
          .filter((group) => selected.includes(group.spieltag))
          .map((group) => (
            <article key={group.spieltag} className="day-section">
              <header className="day-title">
                <h3>Spieltag {group.spieltag}</h3>
                <span>{group.dateLabel}</span>
              </header>
              <div className="card-grid">
                {group.matches.map((match) => (
                  <MatchCard key={match.matchId} match={match} />
                ))}
              </div>
            </article>
          ))}
      </section>
    </main>
  );
}

type RawMatch = {
  spieltag: number;
  date: string;
  matchId: number;
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
};

function buildGroups(matches: RawMatch[]): MatchdayGroup[] {
  const byDay = new Map<number, RawMatch[]>();

  matches.forEach((match) => {
    if (!byDay.has(match.spieltag)) {
      byDay.set(match.spieltag, []);
    }
    byDay.get(match.spieltag)?.push(match);
  });

  return [...byDay.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([spieltag, dayMatches]) => {
      const dates = dayMatches.map((match) => new Date(match.date));
      const first = new Date(Math.min(...dates.map((d) => d.getTime())));
      const last = new Date(Math.max(...dates.map((d) => d.getTime())));
      const dateLabel = `${first.toLocaleDateString('de-DE')} – ${last.toLocaleDateString('de-DE')}`;

      return {
        spieltag,
        dateLabel,
        matches: dayMatches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      };
    });
}
