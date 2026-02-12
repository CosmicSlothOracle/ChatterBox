import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { MatchdayGroup } from './types';

type ExportSectionProps = {
  selectedMatchdays: number[];
  groupedData: MatchdayGroup[];
};

const flattenForExport = (selectedMatchdays: number[], groupedData: MatchdayGroup[]) =>
  groupedData
    .filter((day) => selectedMatchdays.includes(day.spieltag))
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

export default function ExportSection({ selectedMatchdays, groupedData }: ExportSectionProps) {
  const selectedRows = flattenForExport(selectedMatchdays, groupedData);

  const exportPdf = (): void => {
    if (!selectedRows.length) {
      return;
    }

    const doc = new jsPDF();
    doc.setFillColor(220, 38, 38);
    doc.rect(0, 0, 210, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text('1. Bundesliga Ergebnisse', 14, 15);
    doc.setFontSize(10);
    doc.text(`Exportiert: ${new Date().toLocaleString('de-DE')}`, 14, 21);

    autoTable(doc, {
      startY: 32,
      head: [['Spieltag', 'Datum', 'Team A', 'Team B', 'Tore', 'Ergebnis']],
      body: selectedRows.map((row) => [row.spieltag, row.datum, row.teamA, row.teamB, row.tore, row.ergebnis]),
      styles: { fontSize: 9, cellPadding: 2.4 },
      headStyles: { fillColor: [220, 38, 38] },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    doc.save(`bundesliga-export-${Date.now()}.pdf`);
  };

  const exportExcel = (): void => {
    if (!selectedRows.length) {
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(
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

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bundesliga');
    XLSX.writeFile(workbook, `bundesliga-export-${Date.now()}.xlsx`);
  };

  return (
    <section className="export-section">
      <div>
        <h3>Export</h3>
        <p>{selectedRows.length} Spiele in der aktuellen Auswahl</p>
      </div>
      <div className="export-actions">
        <button type="button" onClick={exportPdf} disabled={!selectedRows.length}>
          Als PDF exportieren
        </button>
        <button type="button" onClick={exportExcel} disabled={!selectedRows.length}>
          Als Excel exportieren
        </button>
      </div>
    </section>
  );
}
