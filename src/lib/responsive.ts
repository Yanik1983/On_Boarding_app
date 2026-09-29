// The text panel becomes a bottom sheet on portrait and very narrow screens (phones).
// Keep this in sync with the matching media query in ui/ui.css.
export const SHEET_QUERY = '(orientation: portrait), (max-width: 600px)'

export const isSheetLayout = (width: number, height: number) => height >= width || width <= 600

/** Phones and tablets: cap the resolution a little lower in Auto quality to save battery. */
export const isHandheld = () =>
  typeof window !== 'undefined' && (window.matchMedia?.('(pointer: coarse)').matches ?? false) && Math.min(window.screen.width, window.screen.height) < 820
