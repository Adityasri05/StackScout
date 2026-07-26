/**
 * Cleans raw LLM text output to extract valid JSON.
 * Strips markdown code block wrappers, leading/trailing whitespace,
 * and trailing commas that some models produce.
 */
export function cleanJson(text: string): string {
  let cleaned = text.trim();

  // Strip markdown code fences
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/i, '');

  // Find the first { or [ and last } or ]
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  let start = -1;

  if (firstBrace === -1 && firstBracket === -1) {
    return cleaned;
  } else if (firstBrace === -1) {
    start = firstBracket;
  } else if (firstBracket === -1) {
    start = firstBrace;
  } else {
    start = Math.min(firstBrace, firstBracket);
  }

  const lastBrace = cleaned.lastIndexOf('}');
  const lastBracket = cleaned.lastIndexOf(']');
  let end = Math.max(lastBrace, lastBracket);

  if (end === -1) end = cleaned.length - 1;

  cleaned = cleaned.substring(start, end + 1);

  // Remove trailing commas before closing braces/brackets (common LLM error)
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

  return cleaned;
}
