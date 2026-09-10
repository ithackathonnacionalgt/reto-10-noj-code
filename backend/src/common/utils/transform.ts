import { Transform } from 'class-transformer';

/**
 * Convierte valores de query string ("true", "1", "false", "0") a boolean.
 * Uso: @ABoolean() campo?: boolean;
 */
export const ABoolean = () =>
  Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'boolean') return value;
    if (value === 'true' || value === '1') return true;
    if (value === 'false' || value === '0') return false;
    return undefined;
  });
