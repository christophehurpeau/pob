declare module "parse-author" {
  interface Author {
    name?: string;
    email?: string;
    url?: string;
  }
  export default function parseAuthor(author: string): Author;
}

declare module "lodash.camelcase" {
  export default function camelCase(value: string): string;
}
