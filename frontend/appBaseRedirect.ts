export function appBaseRedirect(url: string | undefined): string | null {
  return url === '/app' ? '/app/' : null
}
