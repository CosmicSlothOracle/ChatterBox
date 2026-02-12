import type { Match } from './types';

type MatchCardProps = {
  match: Match;
};

const formatDate = (date: string): string =>
  new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));

export default function MatchCard({ match }: MatchCardProps) {
  const totalGoals = match.scoreA + match.scoreB;

  return (
    <article className="match-card">
      <header className="match-meta">
        <span>{formatDate(match.date)}</span>
        <span>{totalGoals} Tore</span>
      </header>
      <div className="match-row">
        <span className="team">{match.teamA}</span>
        <strong className="score">{match.scoreA}</strong>
      </div>
      <div className="match-row">
        <span className="team">{match.teamB}</span>
        <strong className="score">{match.scoreB}</strong>
      </div>
      <footer className="result-pill">
        Ergebnis: {match.teamA} {match.scoreA}:{match.scoreB} {match.teamB}
      </footer>
    </article>
  );
}
