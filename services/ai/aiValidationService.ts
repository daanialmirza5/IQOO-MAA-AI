/**
 * AI-assisted validation/explanation layer — architecture only in this
 * build, wired for real use the moment a backend proxy exists.
 *
 * IMPORTANT — why this calls a backend proxy, not a provider API directly:
 * MaAI has no backend. A React Native / web client has no place to hold a
 * real LLM provider API key: anything shipped in client JS (including
 * anything under an EXPO_PUBLIC_* env var) is readable by opening the
 * bundle, so embedding a provider key here would leak it. The correct,
 * safe shape is a thin backend endpoint that holds the real key server-side
 * and this client calls THAT endpoint. See docs/SECURITY.md and
 * docs/AI_PIPELINE.md.
 *
 * Until EXPO_PUBLIC_AI_VALIDATION_ENDPOINT is set to a real deployed proxy,
 * every function here returns a clearly-labeled "not configured" result —
 * nothing is faked, no network call is made, and no UI should present a
 * result from this module as if it were a live AI response unless
 * `isAiValidationConfigured()` is true.
 *
 * Authority boundary (also enforced by callers, not just documented here):
 * this service may only ANNOTATE or EXPLAIN output already produced by the
 * deterministic risk engine / field-extraction regexes. It must never be
 * given the power to change `overallRisk`, a lab value, or a saved record.
 */

export interface AiValidationRequest {
  task: 'EXPLAIN_RISK' | 'VALIDATE_OCR_FIELDS' | 'NORMALIZE_TERMINOLOGY';
  context: Record<string, unknown>;
}

export interface AiValidationResponse {
  ok: true;
  explanation?: string;
  suggestedCorrections?: Record<string, unknown>;
  citedSource?: string;
}

export interface AiValidationUnavailable {
  ok: false;
  reason: 'NOT_CONFIGURED' | 'NETWORK_ERROR' | 'INVALID_RESPONSE';
  detail: string;
}

export type AiValidationResult = AiValidationResponse | AiValidationUnavailable;

function getEndpoint(): string | undefined {
  return process.env.EXPO_PUBLIC_AI_VALIDATION_ENDPOINT;
}

export function isAiValidationConfigured(): boolean {
  return !!getEndpoint();
}

/**
 * Schema-validates a proxy response before trusting any of it. A response
 * missing `ok: true` or with the wrong shape is treated as unavailable, not
 * silently coerced.
 */
function parseResponse(json: unknown): AiValidationResult {
  if (
    typeof json === 'object' &&
    json !== null &&
    'ok' in json &&
    (json as { ok: unknown }).ok === true
  ) {
    const r = json as Record<string, unknown>;
    return {
      ok: true,
      explanation: typeof r.explanation === 'string' ? r.explanation : undefined,
      suggestedCorrections:
        typeof r.suggestedCorrections === 'object' && r.suggestedCorrections !== null
          ? (r.suggestedCorrections as Record<string, unknown>)
          : undefined,
      citedSource: typeof r.citedSource === 'string' ? r.citedSource : undefined,
    };
  }
  return { ok: false, reason: 'INVALID_RESPONSE', detail: 'Proxy response did not match the expected schema.' };
}

async function callValidationProxy(request: AiValidationRequest): Promise<AiValidationResult> {
  const endpoint = getEndpoint();
  if (!endpoint) {
    return { ok: false, reason: 'NOT_CONFIGURED', detail: 'EXPO_PUBLIC_AI_VALIDATION_ENDPOINT is not set — see .env.example.' };
  }
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      return { ok: false, reason: 'NETWORK_ERROR', detail: `Validation proxy returned HTTP ${res.status}.` };
    }
    return parseResponse(await res.json());
  } catch (e) {
    return { ok: false, reason: 'NETWORK_ERROR', detail: e instanceof Error ? e.message : 'Unknown network error.' };
  }
}

/**
 * Requests a plain-language explanation of an ALREADY-COMPUTED risk result.
 * The caller passes the deterministic engine's own output as context; the
 * response is explanatory text only and must never be used to change the
 * displayed risk level.
 */
export function explainRiskAssessment(evidence: { overallRisk: string; reasons: string[] }): Promise<AiValidationResult> {
  return callValidationProxy({ task: 'EXPLAIN_RISK', context: evidence });
}

/**
 * Asks the proxy to sanity-check regex-extracted OCR fields (e.g. flag a
 * value that's numerically valid but contextually implausible). Any
 * `suggestedCorrections` returned are surfaced to the human reviewer as
 * suggestions in the confirm-before-save step — never auto-applied.
 */
export function validateOcrFields(rawText: string, extractedFields: Record<string, unknown>): Promise<AiValidationResult> {
  return callValidationProxy({ task: 'VALIDATE_OCR_FIELDS', context: { rawText, extractedFields } });
}
