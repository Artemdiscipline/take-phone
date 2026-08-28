'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { basePath, isStaticPreview, withBase } from '@/lib/build-mode';

type AnchorProps = React.ComponentPropsWithoutRef<'a'>;

/**
 * Внутренняя ссылка.
 *
 * В обычной сборке это `next/link` с клиентской навигацией. В статической
 * витрине — обычная `<a>`: роутер Next не знает о подпапке, поэтому его
 * навигация там всё равно вела бы на несуществующие адреса. Обычные переходы
 * работают корректно и ничем не хуже для превью.
 */
export function AppLink({ href, children, ...rest }: AnchorProps & { href: string }) {
  const target = withBase(href);

  if (isStaticPreview) {
    return <a href={target} {...rest}>{children}</a>;
  }

  return <Link href={target} {...rest}>{children}</Link>;
}

/** Программный переход, работающий в обоих режимах сборки. */
export function useNavigate(): (href: string) => void {
  const router = useRouter();

  return (href: string) => {
    const target = withBase(href);
    if (isStaticPreview) window.location.assign(target);
    else router.push(target);
  };
}

export { basePath, withBase };
