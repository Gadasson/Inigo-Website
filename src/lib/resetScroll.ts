/** Instantly reset document scroll (use on route change, not for animated scroll-to-top). */
export function resetScroll(): void {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}
