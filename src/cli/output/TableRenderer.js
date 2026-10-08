export function renderTable(rows) {
  if (rows.length === 0) return '';
  const columns = Object.keys(rows[0]);
  const widths = columns.map(column => Math.max(column.length, ...rows.map(row => String(row[column]).length)));
  const renderLine = values => values.map((value, index) => String(value).padEnd(widths[index])).join('  ').trimEnd();
  return [
    renderLine(columns),
    renderLine(widths.map(width => '-'.repeat(width))),
    ...rows.map(row => renderLine(columns.map(column => row[column]))),
  ].join('\n');
}
