import Image from 'next/image';

import { withBase } from '@/lib/build-mode';
import { site } from '@/lib/site';

/** Пропорции исходного файла — задаются явно, чтобы не было сдвига вёрстки. */
const LOGO = { src: '/assets/brand/take-phone-logo.png', width: 334, height: 120 };
const MARK = { src: '/assets/brand/take-phone-mark.png', width: 181, height: 192 };

/**
 * Логотип магазина.
 *
 * `full` — знак с надписью, `mark` — только знак. Высота задаётся снаружи
 * классом, ширина считается по соотношению сторон.
 */
export function Logo({
  variant = 'full',
  className = '',
  priority = false,
}: {
  variant?: 'full' | 'mark';
  className?: string;
  priority?: boolean;
}) {
  const asset = variant === 'full' ? LOGO : MARK;

  return (
    <Image
      src={withBase(asset.src)}
      alt={site.name}
      width={asset.width}
      height={asset.height}
      priority={priority}
      className={`w-auto ${className}`}
    />
  );
}
