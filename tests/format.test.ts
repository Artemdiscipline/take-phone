import { describe, expect, it } from 'vitest';

import { withBase } from '@/lib/build-mode';
import { formatPrice } from '@/lib/format';

describe('форматирование цены', () => {
  it('перед знаком рубля стоит неразрывный пробел', () => {
    // С обычным пробелом «₽» отрывался от суммы и уезжал на другую строку.
    expect(formatPrice(119_990)).toContain('\u00A0₽');
    expect(formatPrice(119_990)).not.toMatch(/\d ₽$/);
  });

  it('разряды разделяются, дробная часть не показывается', () => {
    expect(formatPrice(119_990.4).replace(/\u00A0|\u202F/g, ' ')).toBe('119 990 ₽');
    expect(formatPrice(0)).toBe('0\u00A0₽');
  });

  it('внутри числа тоже нет обычного пробела', () => {
    // Иначе «119» и «990» разъезжались бы по строкам.
    expect(formatPrice(119_990)).not.toContain('119 990');
  });
});

describe('withBase', () => {
  it('без префикса возвращает путь как есть', () => {
    // NEXT_PUBLIC_BASE_PATH в тестах не задан.
    expect(withBase('/assets/products/a.webp')).toBe('/assets/products/a.webp');
    expect(withBase('/')).toBe('/');
  });

  it('не трогает внешние адреса', () => {
    expect(withBase('https://example.test/a.png')).toBe('https://example.test/a.png');
  });
});
