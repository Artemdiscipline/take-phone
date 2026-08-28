import Link from 'next/link';
import { site } from '@/lib/site';
import { categories, mainNav } from './nav-data';

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="shell grid gap-10 py-14 md:grid-cols-[1.2fr_1fr_1fr_1.1fr]">
        <div>
          <span className="block text-[17px] font-semibold tracking-[-0.03em]">TAKE PHONE</span>
          <p className="mt-3 max-w-[260px] text-sm text-ink-soft">
            Магазин техники в Тюмени. Актуальные цены и наличие, гарантия до 5 лет
            и собственный сервис.
          </p>
        </div>

        <nav aria-label="Каталог">
          <p className="field-label">Каталог</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {categories.slice(0, 5).map((category) => (
              <li key={category.id}>
                <Link
                  href={category.href}
                  className={category.ready ? 'transition hover:text-accent' : 'text-ink-faint'}
                >
                  {category.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Информация">
          <p className="field-label">Покупателю</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {mainNav.slice(1).map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition hover:text-accent">
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/staff" className="text-ink-faint transition hover:text-accent">
                Сотрудникам
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <p className="field-label">Контакты</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <a href={site.phoneHref} className="font-medium transition hover:text-accent">
                {site.phone}
              </a>
            </li>
            <li className="text-ink-soft">{site.addressFull}</li>
            <li className="text-ink-soft">{site.workingHours}</li>
            <li className="flex gap-4 pt-1">
              <a href={site.telegram} target="_blank" rel="noreferrer" className="transition hover:text-accent">
                Telegram
              </a>
              <a href={site.vk} target="_blank" rel="noreferrer" className="transition hover:text-accent">
                ВКонтакте
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="shell flex flex-col gap-2 py-5 text-[12px] text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Take Phone</span>
          <span>
            {site.legalNote}. Цены и наличие подтверждает менеджер при оформлении заявки.
          </span>
        </div>
      </div>
    </footer>
  );
}
