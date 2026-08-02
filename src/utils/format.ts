/**
 * Helper to convert full names into initials only (e.g., "אהרן דוד" -> "א. ד.")
 */
export function formatInitials(name?: string, firstName?: string, lastName?: string): string {
  if (firstName && lastName) {
    const f = firstName.trim().charAt(0).toUpperCase();
    const l = lastName.trim().charAt(0).toUpperCase();
    return `${f}. ${l}.`;
  }
  if (firstName) {
    const f = firstName.trim().charAt(0).toUpperCase();
    return `${f}.`;
  }

  if (!name || !name.trim()) return 'א. ש.';

  let str = name.includes('@') ? name.split('@')[0] : name;
  str = str.replace(/[._-]/g, ' ').trim();

  const parts = str.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'א. ש.';

  if (parts.length === 1) {
    return `${parts[0].charAt(0).toUpperCase()}.`;
  }

  const firstInit = parts[0].charAt(0).toUpperCase();
  const lastInit = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${firstInit}. ${lastInit}.`;
}
