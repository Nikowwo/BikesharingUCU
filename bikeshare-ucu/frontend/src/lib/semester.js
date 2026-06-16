export function getCurrentSemester() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  if (month >= 3 && month <= 7) {
    return `${year}-S1`;
  }
  return `${year}-S2`;
}
