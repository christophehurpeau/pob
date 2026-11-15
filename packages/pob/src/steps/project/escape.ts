/** `<%= value %>` of ejs */
export const escapeHtml = (value: string): string =>
  value.replaceAll(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&#34;";
      default:
        return "&#39;";
    }
  });
