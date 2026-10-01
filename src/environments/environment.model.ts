export interface Environment {
  readonly production: boolean;
  /** URL base del backend (sin "/" final). */
  readonly apiUrl: string;
  /** Si es true, un interceptor simula el backend en memoria. */
  readonly useMockBackend: boolean;
}
