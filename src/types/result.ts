export type Ok<T> = { ok: true; value: T };
export const resultOk = <T>(value: T): Ok<T> => ({ ok: true, value });
export type Err<E> = { ok: false; error: E };
export const resultErr = <E>(error: E): Err<E> => ({ ok: false, error });
export type Result<T, E> = Ok<T> | Err<E>;

export const mapResult = <T, E, U>(
  result: Result<T, E>,
  f: (value: T) => U
): Result<U, E> => {
  if (result.ok) return resultOk(f(result.value));
  return result;
};

export const resultBoth = <T, E>(
  result: Result<T, E>,
  result2: Result<T, E>,
  f: (value: T, value2: T) => T
): Result<T, E> => {
  if (result.ok && result2.ok) return resultOk(f(result.value, result2.value));
  return result;
};
