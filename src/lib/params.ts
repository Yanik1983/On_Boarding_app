// Optional URL parameters, e.g. file.html?preview&station=products&quality=ultra
// preview   – unlock every station (for trainers and reviewers)
// station   – open a station by id
// quality   – auto | high | ultra
// textonly  – start in text-only mode
// debug     – show a frame-rate meter
const params = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search)

export const urlOptions = {
  preview: params.has('preview'),
  station: params.get('station'),
  quality: params.get('quality'),
  textOnly: params.has('textonly'),
  debug: params.has('debug'),
}
