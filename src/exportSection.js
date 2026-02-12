const flattenSelection = (selected, groupedData) =>
  groupedData
    .filter((day) => selected.includes(day.spieltag))
    .flatMap((day) =>
      day.matches.map((match) => ({
        spieltag: day.spieltag,
        datum: new Date(match.date).toLocaleString('de-DE'),
        teamA: match.teamA,
        teamB: match.teamB,
        tore: match.scoreA + match.scoreB,
        ergebnis: `${match.scoreA}:${match.scoreB}`
      }))
    );

export const createExportSection = ({ getSelectedMatchdays, getGroups }) => {
  const section = document.createElement('section');
  section.className = 'export-section';

  const titleWrap = document.createElement('div');
  const title = document.createElement('h3');
  title.textContent = 'Export';
  const subtitle = document.createElement('p');
  titleWrap.append(title, subtitle);

  const actions = document.createElement('div');
  actions.className = 'export-actions';

  const pdfButton = document.createElement('button');
  pdfButton.type = 'button';
  pdfButton.textContent = 'Als PDF exportieren';

  const xlsxButton = document.createElement('button');
  xlsxButton.type = 'button';
  xlsxButton.textContent = 'Als Excel exportieren';

  const update = () => {
    const selectedRows = flattenSelection(getSelectedMatchdays(), getGroups());
    subtitle.textContent = `${selectedRows.length} Spiele in der aktuellen Auswahl`;
    pdfButton.disabled = selectedRows.length === 0;
    xlsxButton.disabled = selectedRows.length === 0;
  };

  pdfButton.addEventListener('click', () => {
    const selectedRows = flattenSelection(getSelectedMatchdays(), getGroups());
    if (!selectedRows.length) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFillColor(220, 38, 38);
    doc.rect(0, 0, 210, 26, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text('1. Bundesliga Ergebnisse', 14, 15);
    doc.setFontSize(10);
    doc.text(`Exportiert: ${new Date().toLocaleString('de-DE')}`, 14, 21);

    doc.autoTable({
      startY: 32,
      head: [['Spieltag', 'Datum', 'Team A', 'Team B', 'Tore', 'Ergebnis']],
      body: selectedRows.map((r) => [r.spieltag, r.datum, r.teamA, r.teamB, r.tore, r.ergebnis]),
      headStyles: { fillColor: [220, 38, 38] },
      styles: { fontSize: 9, cellPadding: 2.4 }
    });

    doc.save(`bundesliga-export-${Date.now()}.pdf`);
  });

  xlsxButton.addEventListener('click', () => {
    const selectedRows = flattenSelection(getSelectedMatchdays(), getGroups());
    if (!selectedRows.length) return;

    const worksheet = window.XLSX.utils.json_to_sheet(
      selectedRows.map((row) => ({
        Spieltag: row.spieltag,
        Datum: row.datum,
        'Team A': row.teamA,
        'Team B': row.teamB,
        Tore: row.tore,
        Ergebnis: row.ergebnis
      }))
    );
    worksheet['!cols'] = [{ wch: 10 }, { wch: 20 }, { wch: 25 }, { wch: 25 }, { wch: 8 }, { wch: 10 }];

    const workbook = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(workbook, worksheet, 'Bundesliga');
    window.XLSX.writeFile(workbook, `bundesliga-export-${Date.now()}.xlsx`);
  });

  actions.append(pdfButton, xlsxButton);
  section.append(titleWrap, actions);
  update();

  return { element: section, update };
};
