/** Keep stored artwork portable; only bundled images need the hosting prefix. */
export function artworkSource(source: string, basePath = "/"): string {
  return source.startsWith("/images/")
    ? `${basePath.replace(/\/$/, "")}${source}`
    : source;
}
