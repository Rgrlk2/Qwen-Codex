/** Clave de idempotencia para una creación o una acción de estado. */
export function nuevaClaveIdempotencia(): string {
  return globalThis.crypto.randomUUID();
}
