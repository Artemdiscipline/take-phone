import { isStaticPreview } from '@/lib/build-mode';
import { site } from '@/lib/site';
import { Logo } from './logo';
import type { CategoryId } from '@/lib/catalog/types';
import { buildCategoryMenu, mainNav } from './nav-data';
import { AppLink } from '@/components/site/app-link';

export function Footer({ populatedCategories = [] }: { populatedCategories?: CategoryId[] }) {
  const categories = buildCategoryMenu(populatedCategories);

  return (
    <footer className="border-t border-line bg-surface">
      <div className="shell grid gap-10 py-14 md:grid-cols-[1.2fr_1fr_1fr_1.1fr]">
        <div>
          <Logo variant="full" className="h-7" />
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
                {category.href
                  ? (
                    <AppLink href={category.href} className="transition hover:text-accent">
                      {category.label}
                    </AppLink>
                  )
                  : <span className="text-ink-faint">{category.label}</span>}
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Информация">
          <p className="field-label">Покупателю</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {mainNav.slice(1).map((link) => (
              <li key={link.href}>
                <AppLink href={link.href} className="transition hover:text-accent">
                  {link.label}
                </AppLink>
              </li>
            ))}
            <li>
              <AppLink href="/privacy" className="transition hover:text-accent">
                Обработка данных
              </AppLink>
            </li>
            {!isStaticPreview && (
              <li>
                <AppLink href="/staff" className="text-ink-faint transition hover:text-accent">
                  Сотрудникам
                </AppLink>
              </li>
            )}
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
              <a href={site.telegramChannel} target="_blank" rel="noreferrer" className="transition hover:text-accent">
                Telegram-канал
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
