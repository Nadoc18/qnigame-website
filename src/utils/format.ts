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
  
  const f = parts[0].charAt(0).toUpperCase();
  const l = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${f}. ${l}.`;
}

/**
 * Returns the full name if the viewer is an admin or the user themselves,
 * otherwise returns anonymized initials.
 */
export function getDisplayName(
  username?: string,
  firstName?: string,
  lastName?: string,
  isCurrentUser: boolean = false,
  isAdmin: boolean = false
): string {
  if (isCurrentUser || isAdmin) {
    if (firstName && lastName) return `${firstName} ${lastName}`;
    if (firstName) return firstName;
    if (lastName) return lastName;
    return username || 'אנונימי';
  }
  return formatInitials(username, firstName, lastName);
}


