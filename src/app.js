import { createExportSection } from './exportSection.js';
import { createMatchCard } from './matchCard.js';
import { fetchBundesligaResults, loadCache, saveCache } from './services/bundesligaService.js';
import { fallbackPayload } from './services/seedData.js';

const state = {
  groups: [],
  selected: [],
  loading: false,
  lastUpdated: '',
  error: ''
};

const formatTimestamp = (value) => (value ? new Date(value).toLocaleString('de-DE') : 'Noch nie');

const buildGroups = (matches) => {
  const byDay = new Map();
  matches.forEach((match) => {
    if (!byDay.has(match.spieltag)) byDay.set(match.spieltag, []);
    byDay.get(match.spieltag).push(match);
  });

  return [...byDay.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([spieltag, dayMatches]) => {
      const times = dayMatches.map((m) => new Date(m.date).getTime());
      const first = new Date(Math.min(...times));
      const last = new Date(Math.max(...times));

      return {
        spieltag,
        dateLabel: `${first.toLocaleDateString('de-DE')} – ${last.toLocaleDateString('de-DE')}`,
        matches: dayMatches.sort((a, b) => new Date(a.date) - new Date(b.date))
      };
    });
};

export const renderApp = (root) => {
  root.innerHTML = '';

  const shell = document.createElement('main');
  shell.className = 'app-shell';

  const topbar = document.createElement('header');
  topbar.className = 'topbar';
  const titleWrap = document.createElement('div');
  titleWrap.innerHTML = `
    <p class="badge">Bundesliga Dashboard</p>
    <h1>1. Bundesliga – Ergebnisse nach Spieltag</h1>
    <p class="sub" id="updated-text">Zuletzt aktualisiert: ${formatTimestamp(state.lastUpdated)}</p>
  `;
  const refreshButton = document.createElement('button');
  refreshButton.className = 'refresh';
  refreshButton.textContent = '🔄 Aktualisieren';
  topbar.append(titleWrap, refreshButton);

  const controls = document.createElement('section');
  controls.className = 'controls';
  controls.innerHTML = `
    <div class="controls-head">
      <h2>Spieltage auswählen</h2>
      <div class="bulk-actions">
        <button type="button" id="select-all">Alle auswählen</button>
        <button type="button" id="clear-all">Auswahl aufheben</button>
      </div>
    </div>
    <div class="checkbox-grid" id="checkbox-grid"></div>
  `;

  const errorEl = document.createElement('p');
  errorEl.className = 'error';
  errorEl.style.display = 'none';

  const matchdays = document.createElement('section');
  matchdays.className = 'matchdays';

  const exportSection = createExportSection({
    getSelectedMatchdays: () => state.selected,
    getGroups: () => state.groups
  });

  shell.append(topbar, controls, exportSection.element, errorEl, matchdays);
  root.append(shell);

  const checkboxGrid = controls.querySelector('#checkbox-grid');
  const updatedText = titleWrap.querySelector('#updated-text');

  const rerender = () => {
    updatedText.textContent = `Zuletzt aktualisiert: ${formatTimestamp(state.lastUpdated)}`;
    refreshButton.disabled = state.loading;
    refreshButton.textContent = state.loading ? 'Aktualisiere…' : '🔄 Aktualisieren';

    errorEl.style.display = state.error ? 'block' : 'none';
    errorEl.textContent = state.error;

    checkboxGrid.innerHTML = '';
    state.groups.forEach((group) => {
      const active = state.selected.includes(group.spieltag);
      const label = document.createElement('label');
      label.className = `day-chip ${active ? 'active' : ''}`;
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = active;
      input.addEventListener('change', () => {
        if (state.selected.includes(group.spieltag)) {
          state.selected = state.selected.filter((d) => d !== group.spieltag);
        } else {
          state.selected = [...state.selected, group.spieltag].sort((a, b) => a - b);
        }
        rerender();
      });
      label.append(input, `Spieltag ${group.spieltag}`);
      checkboxGrid.append(label);
    });

    matchdays.innerHTML = '';
    state.groups
      .filter((group) => state.selected.includes(group.spieltag))
      .forEach((group) => {
        const section = document.createElement('article');
        section.className = 'day-section';
        section.innerHTML = `
          <header class="day-title">
            <h3>Spieltag ${group.spieltag}</h3>
            <span>${group.dateLabel}</span>
          </header>
          <div class="card-grid"></div>
        `;
        const grid = section.querySelector('.card-grid');
        group.matches.forEach((match) => grid.append(createMatchCard(match)));
        matchdays.append(section);
      });

    exportSection.update();
  };

  controls.querySelector('#select-all').addEventListener('click', () => {
    state.selected = state.groups.map((g) => g.spieltag);
    rerender();
  });

  controls.querySelector('#clear-all').addEventListener('click', () => {
    state.selected = [];
    rerender();
  });

  const bootstrap = async () => {
    const cached = loadCache();
    if (cached) {
      state.groups = buildGroups(cached.matches);
      state.selected = state.groups.map((g) => g.spieltag);
      state.lastUpdated = cached.updatedAt;
      state.error = '';
      rerender();
    }

    state.loading = true;
    rerender();

    try {
      const fresh = await fetchBundesligaResults();
      saveCache(fresh);
      state.groups = buildGroups(fresh.matches);
      if (!state.selected.length) {
        state.selected = state.groups.map((g) => g.spieltag);
      }
      state.lastUpdated = fresh.updatedAt;
      state.error = '';
    } catch {
      if (!cached) {
        state.groups = buildGroups(fallbackPayload.matches);
        state.selected = state.groups.map((g) => g.spieltag);
        state.lastUpdated = fallbackPayload.updatedAt;
        state.error = 'Live-Daten konnten nicht geladen werden. Es werden lokale Beispieldaten angezeigt.';
      }
    } finally {
      state.loading = false;
      rerender();
    }
  };

  refreshButton.addEventListener('click', bootstrap);

  rerender();
  bootstrap();
};
