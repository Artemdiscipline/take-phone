'use client';

import { useEffect, useState } from 'react';
import {
  ChevronRight,
  Clock3,
  LockKeyhole,
  MapPin,
  Menu,
  Phone,
  Search,
  ShoppingBag,
  X,
} from 'lucide-react';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useRequest } from '@/components/order/request-store';
import { isStaticPreview } from '@/lib/build-mode';
import { site } from '@/lib/site';
import { categories, mainNav } from './nav-data';
import { AppLink, useNavigate } from '@/components/site/app-link';

export function Header() {
  const navigate = useNavigate();
  const { items, open, lastAdded } = useRequest();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);

  useEffect(() => {
    if (!catalogOpen) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setCatalogOpen(false);
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [catalogOpen]);

  const submitSearch = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = query.trim();
    navigate(value ? `/catalog?q=${encodeURIComponent(value)}` : '/catalog');
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/95 backdrop-blur-xl">
      <div className="hidden bg-plum text-white/70 lg:block">
        <div className="shell flex h-9 items-center justify-between text-[12px]">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5" aria-hidden />
              {site.city}, {site.address}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock3 className="size-3.5" aria-hidden />
              {site.workingHours}
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a className="transition hover:text-white" href={site.telegramManager} target="_blank" rel="noreferrer">
              Написать менеджеру
            </a>
            <a className="flex items-center gap-1.5 transition hover:text-white" href={site.phoneHref}>
              <Phone className="size-3.5" aria-hidden />
              {site.phone}
            </a>
            {!isStaticPreview && (
              <AppLink className="flex items-center gap-1.5 transition hover:text-white" href="/staff">
                <LockKeyhole className="size-3.5" aria-hidden />
                Сотрудникам
              </AppLink>
            )}
          </div>
        </div>
      </div>

      <div className="shell flex h-[68px] items-center gap-4">
        <AppLink href="/" className="shrink-0 leading-none" aria-label="Take Phone — на главную">
          <span className="block text-[17px] font-semibold tracking-[-0.03em]">TAKE PHONE</span>
          <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.2em] text-ink-faint">
            Техника · {site.city}
          </span>
        </AppLink>

        <button
          type="button"
          onClick={() => setCatalogOpen((value) => !value)}
          aria-expanded={catalogOpen}
          className="ml-4 hidden h-11 items-center gap-2 rounded-xl bg-plum px-4 text-[13px] font-medium text-white transition hover:bg-plum-soft lg:flex"
        >
          <Menu className="size-4" aria-hidden />
          Каталог
        </button>

        <form onSubmit={submitSearch} className="hidden w-full max-w-[380px] flex-1 md:block">
          <label className="flex h-11 items-center gap-2.5 rounded-xl bg-surface px-3.5 transition focus-within:bg-surface-2">
            <Search className="size-4 shrink-0 text-ink-faint" aria-hidden />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full bg-transparent text-sm outline-none placeholder:text-ink-faint"
              placeholder="Поиск по каталогу"
              aria-label="Поиск по каталогу"
              type="search"
            />
          </label>
        </form>

        <nav className="hidden shrink-0 items-center gap-6 text-[13px] text-ink-soft xl:flex">
          {mainNav.slice(1).map((link) => (
            <AppLink key={link.href} href={link.href} className="transition hover:text-accent">
              {link.label}
            </AppLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-4">
          <AppLink
            href="/catalog"
            className="grid size-11 place-items-center rounded-xl bg-surface text-ink-soft md:hidden"
            aria-label="Поиск по каталогу"
          >
            <Search className="size-4" aria-hidden />
          </AppLink>

          <button
            type="button"
            onClick={open}
            className="relative flex h-11 items-center gap-2 rounded-xl bg-plum px-4 text-[13px] font-medium text-white transition hover:bg-plum-soft"
          >
            <ShoppingBag className={`size-4 ${lastAdded ? 'added-pop' : ''}`} aria-hidden />
            <span className="hidden sm:inline">Заявка</span>
            {items.length > 0 && (
              <span
                key={items.length}
                className="badge-count grid size-5 place-items-center rounded-full bg-white text-[11px] font-semibold text-plum"
              >
                {items.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="grid size-11 place-items-center rounded-xl border border-line lg:hidden"
            aria-label="Открыть меню"
          >
            <Menu className="size-4" aria-hidden />
          </button>
        </div>
      </div>

      {catalogOpen && (
        <div className="collapse-open hidden border-t border-line bg-paper lg:block">
          <div className="shell grid grid-cols-4 gap-2 py-6">
            {categories.map((category) => category.href
              ? (
                <AppLink
                  key={category.id}
                  href={category.href}
                  onClick={() => setCatalogOpen(false)}
                  className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition hover:bg-surface"
                >
                  {category.label}
                  <span className="text-[11px] text-ink-faint">{category.note}</span>
                </AppLink>
              )
              : (
                <span
                  key={category.id}
                  className="flex items-center justify-between rounded-xl px-4 py-3 text-sm text-ink-faint"
                >
                  {category.label}
                  <span className="text-[11px]">{category.note}</span>
                </span>
              ))}
          </div>
        </div>
      )}

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-[86%] gap-0 border-line bg-paper p-0 text-ink sm:max-w-[360px]">
          <SheetHeader className="border-b border-line p-6">
            <SheetTitle className="text-lg font-semibold tracking-[-0.02em]">TAKE PHONE</SheetTitle>
            <SheetDescription>Магазин техники в Тюмени</SheetDescription>
          </SheetHeader>

          <div className="overflow-y-auto">
            <form onSubmit={submitSearch} className="border-b border-line p-4">
              <label className="flex h-11 items-center gap-2.5 rounded-xl bg-surface px-3.5">
                <Search className="size-4 shrink-0 text-ink-faint" aria-hidden />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-ink-faint"
                  placeholder="Поиск по каталогу"
                  aria-label="Поиск по каталогу"
                  type="search"
                />
                {query && (
                  <button type="button" onClick={() => setQuery('')} aria-label="Очистить поиск">
                    <X className="size-4 text-ink-faint" aria-hidden />
                  </button>
                )}
              </label>
            </form>

            <nav className="grid divide-y divide-line text-sm">
              {mainNav.map((link) => (
                <AppLink
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex h-14 items-center justify-between px-6 font-medium"
                >
                  {link.label}
                  <ChevronRight className="size-4 text-ink-faint" aria-hidden />
                </AppLink>
              ))}
              {!isStaticPreview && (
                <AppLink
                  href="/staff"
                  onClick={() => setMenuOpen(false)}
                  className="flex h-14 items-center justify-between px-6 text-ink-soft"
                >
                  Сотрудникам
                  <LockKeyhole className="size-4 text-ink-faint" aria-hidden />
                </AppLink>
              )}
            </nav>

            <div className="space-y-2 p-6 text-sm text-ink-soft">
              <p className="flex items-center gap-2">
                <MapPin className="size-4 text-accent" aria-hidden />
                {site.city}, {site.address}
              </p>
              <p className="flex items-center gap-2">
                <Clock3 className="size-4 text-accent" aria-hidden />
                {site.workingHours}
              </p>
              <a href={site.phoneHref} className="flex items-center gap-2 font-medium text-ink">
                <Phone className="size-4 text-accent" aria-hidden />
                {site.phone}
              </a>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
