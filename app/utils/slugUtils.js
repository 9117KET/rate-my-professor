export function professorToSlug(name) {
  return String(name || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

// Given a slug and an array of professor name strings, find the matching name
export function slugToProfessorName(slug, professorNames) {
  return professorNames.find((name) => professorToSlug(name) === slug) || null;
}
