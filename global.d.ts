declare module "prismjs" {
  // ponytail: runtime-only usage; keep declaration minimal to avoid adding a dependency
  const Prism: Record<string, unknown> & {
    highlightElement(element: HTMLElement): void;
  };
  export default Prism;
}

declare module "prismjs/components/prism-*" {
  // ponytail: dynamic load of language components; no type needed at compile time
  const theme: Record<string, unknown>;
  export default theme;
}
