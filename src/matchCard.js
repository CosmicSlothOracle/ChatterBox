const formatDate = (date) =>
  new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));

export const createMatchCard = (match) => {
  const card = document.createElement('article');
  card.className = 'match-card';

  const totalGoals = match.scoreA + match.scoreB;

  card.innerHTML = `
    <header class="match-meta">
      <span>${formatDate(match.date)}</span>
      <span>${totalGoals} Tore</span>
    </header>
    <div class="match-row"><span class="team">${match.teamA}</span><strong class="score">${match.scoreA}</strong></div>
    <div class="match-row"><span class="team">${match.teamB}</span><strong class="score">${match.scoreB}</strong></div>
    <footer class="result-pill">Ergebnis: ${match.teamA} ${match.scoreA}:${match.scoreB} ${match.teamB}</footer>
  `;

  return card;
};
