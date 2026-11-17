const htmlEscapes: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&#34;",
  "'": "&#39;",
};

/** what ejs `<%= %>` did to interpolated values, kept for output parity */
export const escapeHtml = (value: unknown): string =>
  String(value).replaceAll(
    /[&<>"']/g,
    (character) => htmlEscapes[character] ?? character,
  );
