import { HttpErrorResponse } from '@angular/common/http';

/**
 * Extrae un mensaje legible de un error HTTP.
 * Soporta el formato de FastAPI: `{ detail: string }` o `{ detail: [{ msg }] }`.
 */
export function getErrorMessage(error: unknown, fallback = 'Ocurrió un error inesperado'): string {
  if (!(error instanceof HttpErrorResponse)) return fallback;
  if (error.status === 0) return 'No se pudo conectar con el servidor';

  const body: unknown = error.error;
  if (typeof body === 'object' && body !== null) {
    const { detail, message } = body as { detail?: unknown; message?: unknown };
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      const msgs = detail
        .map((d: unknown) => (typeof d === 'object' && d !== null ? (d as { msg?: unknown }).msg : null))
        .filter((m): m is string => typeof m === 'string');
      if (msgs.length) return msgs.join('. ');
    }
    if (typeof message === 'string') return message;
  }
  return fallback;
}
