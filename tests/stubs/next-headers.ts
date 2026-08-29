/**
 * Заглушка `next/headers` для юнит-тестов.
 *
 * Настоящий модуль существует только внутри рантайма Next/vinext. Тесты
 * проверяют чистую логику авторизации (режимы, подпись сессии), а чтение
 * cookie из запроса относится к интеграционному уровню.
 */
export async function cookies() {
  return {
    get: () => undefined,
    set: () => undefined,
    delete: () => undefined,
  };
}
