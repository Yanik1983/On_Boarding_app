/** First name for friendly greetings ("Alex" from "Alex Tester"). */
export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? ''
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

/** Replaces {name} in content texts with the employee's first name. */
export function personalize(text: string, name: string): string {
  return text.replace(/\{name\}/g, firstName(name) || 'colleague')
}
