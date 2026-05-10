/** Active students only (soft-delete aware) */
export function activeStudentMatch(extra = {}) {
  return { deletedAt: null, ...extra };
}
