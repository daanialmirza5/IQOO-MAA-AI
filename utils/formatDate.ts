/** Formats an ISO date/datetime string (as stored in SQLite) into a short, readable display date. */
export function formatDisplayDate(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
