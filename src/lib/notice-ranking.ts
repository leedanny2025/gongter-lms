// Competition ranks stay tied to the highest score, even when viewing low first.
export function rankNoticeRows<T>(rows: T[], name: (row: T) => string, score: ((row: T) => number) | null, ascending: boolean) {
  if (!score) return [...rows].sort((a,b) => (ascending ? 1 : -1) * name(a).localeCompare(name(b), 'ko')).map(row => ({row, rank: null as number | null}));
  const sorted = rows.map(row => ({row, value:score(row)})).sort((a,b) => b.value-a.value || name(a.row).localeCompare(name(b.row),'ko'));
  let rank = 0;
  const ranked = sorted.map((entry,i) => { if (i === 0 || entry.value !== sorted[i-1].value) rank=i+1; return {...entry,rank}; });
  if (ascending) ranked.sort((a,b) => a.value-b.value || name(a.row).localeCompare(name(b.row),'ko'));
  return ranked;
}
