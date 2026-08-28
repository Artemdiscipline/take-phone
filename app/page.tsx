'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronRight,
  CircleGauge,
  Clock3,
  CreditCard,
  Headphones,
  Heart,
  Laptop,
  LockKeyhole,
  MapPin,
  Menu,
  MessageCircle,
  Minus,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Smartphone,
  Store,
  Truck,
  UserRoundCog,
  WalletCards,
  Watch,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';

type Supplier = { name: string; price: number; stock: boolean; updated: string };
type Product = {
  id: number;
  name: string;
  generation: string;
  memory: string;
  color: string;
  price: number;
  oldPrice?: number;
  stock: 'available' | 'order';
  suppliers: Supplier[];
  tone: string;
};

const products: Product[] = [
  {
    id: 1, name: 'iPhone 17 Pro Max', generation: '17', memory: '256 ГБ', color: 'Глубокий фиолетовый', price: 119990, oldPrice: 126490, stock: 'available', tone: 'violet',
    suppliers: [
      { name: 'First Apple', price: 114990, stock: true, updated: '2 мин назад' },
      { name: 'IceApple', price: 116490, stock: true, updated: '4 мин назад' },
      { name: 'Phone24', price: 115990, stock: true, updated: '7 мин назад' },
    ],
  },
  {
    id: 2, name: 'iPhone 17 Pro', generation: '17', memory: '256 ГБ', color: 'Серебристый', price: 109990, oldPrice: 115490, stock: 'available', tone: 'silver',
    suppliers: [
      { name: 'First Apple', price: 104990, stock: true, updated: '2 мин назад' },
      { name: 'IceApple', price: 105490, stock: true, updated: '4 мин назад' },
      { name: 'Phone24', price: 106190, stock: false, updated: '6 мин назад' },
    ],
  },
  {
    id: 3, name: 'iPhone 17 Air', generation: '17', memory: '256 ГБ', color: 'Небесно-голубой', price: 94990, stock: 'available', tone: 'blue',
    suppliers: [
      { name: 'First Apple', price: 89990, stock: false, updated: '2 мин назад' },
      { name: 'IceApple', price: 89990, stock: true, updated: '3 мин назад' },
      { name: 'Phone24', price: 91490, stock: true, updated: '9 мин назад' },
    ],
  },
  {
    id: 4, name: 'iPhone 16 Pro Max', generation: '16', memory: '512 ГБ', color: 'Чёрный титан', price: 124990, oldPrice: 131990, stock: 'available', tone: 'graphite',
    suppliers: [
      { name: 'First Apple', price: 119990, stock: true, updated: '1 мин назад' },
      { name: 'IceApple', price: 121490, stock: false, updated: '5 мин назад' },
      { name: 'Phone24', price: 120990, stock: true, updated: '8 мин назад' },
    ],
  },
  {
    id: 5, name: 'iPhone 16 Pro', generation: '16', memory: '128 ГБ', color: 'Натуральный титан', price: 88990, stock: 'available', tone: 'sand',
    suppliers: [
      { name: 'First Apple', price: 83990, stock: true, updated: '3 мин назад' },
      { name: 'IceApple', price: 84990, stock: true, updated: '6 мин назад' },
      { name: 'Phone24', price: 84290, stock: false, updated: '9 мин назад' },
    ],
  },
  {
    id: 6, name: 'iPhone 16', generation: '16', memory: '256 ГБ', color: 'Ультрамарин', price: 79990, stock: 'order', tone: 'blue',
    suppliers: [
      { name: 'First Apple', price: 75990, stock: false, updated: '2 мин назад' },
      { name: 'IceApple', price: 74990, stock: false, updated: '4 мин назад' },
      { name: 'Phone24', price: 75990, stock: true, updated: '7 мин назад' },
    ],
  },
  {
    id: 7, name: 'iPhone 15 Pro Max', generation: '15', memory: '256 ГБ', color: 'Белый титан', price: 94990, oldPrice: 101990, stock: 'available', tone: 'silver',
    suppliers: [
      { name: 'First Apple', price: 89990, stock: true, updated: '3 мин назад' },
      { name: 'IceApple', price: 91490, stock: true, updated: '5 мин назад' },
      { name: 'Phone24', price: 90990, stock: true, updated: '8 мин назад' },
    ],
  },
  {
    id: 8, name: 'iPhone 15', generation: '15', memory: '128 ГБ', color: 'Розовый', price: 62990, stock: 'order', tone: 'rose',
    suppliers: [
      { name: 'First Apple', price: 58990, stock: false, updated: '1 мин назад' },
      { name: 'IceApple', price: 57990, stock: true, updated: '4 мин назад' },
      { name: 'Phone24', price: 59490, stock: false, updated: '6 мин назад' },
    ],
  },
];

const money = (value: number) => `${new Intl.NumberFormat('ru-RU').format(value)} ₽`;
const categories = [
  { label: 'iPhone', meta: 'В демо', icon: Smartphone, active: true },
  { label: 'Mac', meta: 'Следующий этап', icon: Laptop },
  { label: 'Apple Watch', meta: 'Следующий этап', icon: Watch },
  { label: 'AirPods', meta: 'Следующий этап', icon: Headphones },
];

export default function Home() {
  const [query, setQuery] = useState('');
  const [generation, setGeneration] = useState('Все');
  const [memory, setMemory] = useState('Все');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [cart, setCart] = useState<number[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [staffOpen, setStaffOpen] = useState(false);
  const [orderSent, setOrderSent] = useState(false);
  const [delivery, setDelivery] = useState<'pickup' | 'delivery'>('pickup');
  const [payment, setPayment] = useState<'cash' | 'transfer' | 'card'>('transfer');
  const [markup, setMarkup] = useState(5000);

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesQuery = `${product.name} ${product.memory} ${product.color}`.toLowerCase().includes(normalized);
      const matchesGeneration = generation === 'Все' || product.generation === generation;
      const matchesMemory = memory === 'Все' || product.memory.startsWith(memory);
      const matchesStock = !onlyAvailable || product.stock === 'available';
      return matchesQuery && matchesGeneration && matchesMemory && matchesStock;
    });
  }, [query, generation, memory, onlyAvailable]);

  const cartProducts = products.filter((product) => cart.includes(product.id));
  const baseTotal = cartProducts.reduce((sum, product) => sum + product.price, 0);
  const paymentTotal = payment === 'card' ? Math.round(baseTotal * 1.135) : baseTotal;
  const scrollToCatalog = () => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
  const addToCart = (id: number) => { setCart((current) => current.includes(id) ? current : [...current, id]); setCartOpen(true); };
  const submitOrder = (event: { preventDefault: () => void }) => { event.preventDefault(); setOrderSent(true); };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#fbfaff] text-[#1d1726]">
      <div className="bg-[#241238] px-4 py-2 text-center text-[12px] font-medium tracking-wide text-white sm:text-[13px]">
        <span className="inline-flex items-center gap-2"><RefreshCw className="size-3.5" /> Цены и наличие обновляются автоматически</span>
      </div>

      <header className="sticky top-0 z-40 border-b border-[#2f1945]/8 bg-white/88 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1320px] items-center gap-5 px-4 sm:px-6 lg:px-8">
          <button className="flex items-center gap-2.5" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Take Phone — наверх">
            <span className="grid size-10 place-items-center rounded-[14px] bg-[#2b1244] text-sm font-black tracking-[-0.08em] text-white shadow-[0_8px_24px_rgba(43,18,68,.18)]">TP</span>
            <span className="text-left leading-none"><span className="block text-[17px] font-black tracking-[-0.04em]">TAKE PHONE</span><span className="mt-1 block text-[10px] font-semibold tracking-[0.17em] text-[#7b6d88]">ТЮМЕНЬ</span></span>
          </button>
          <nav className="ml-8 hidden items-center gap-7 text-sm font-semibold text-[#665b71] lg:flex">
            <button onClick={scrollToCatalog} className="transition hover:text-[#6f2da8]">Каталог</button>
            <a href="#benefits" className="transition hover:text-[#6f2da8]">Преимущества</a>
            <a href="#store" className="transition hover:text-[#6f2da8]">Магазин</a>
          </nav>
          <label className="ml-auto hidden h-11 w-full max-w-[330px] items-center gap-3 rounded-full border border-[#2f1945]/10 bg-[#f6f2f9] px-4 md:flex">
            <Search className="size-4 text-[#796d84]" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm outline-none placeholder:text-[#968b9f]" placeholder="Найти технику" />
          </label>
          <Button onClick={() => setStaffOpen(true)} variant="ghost" className="hidden h-10 rounded-full px-3 text-[#5b4f65] sm:inline-flex"><UserRoundCog /> <span className="hidden xl:inline">Сотрудникам</span></Button>
          <Button onClick={() => setCartOpen(true)} className="relative h-11 rounded-full bg-[#2b1244] px-4 text-white hover:bg-[#452063]"><ShoppingBag /> <span className="hidden sm:inline">Заявка</span>{cart.length > 0 && <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-[#9e59d1] text-[10px] font-bold">{cart.length}</span>}</Button>
          <Button onClick={() => setMobileOpen(true)} variant="outline" size="icon-lg" className="rounded-full lg:hidden"><Menu /></Button>
        </div>
      </header>

      <section className="relative isolate overflow-hidden border-b border-[#2f1945]/8 bg-white">
        <div className="hero-orb hero-orb-one" /><div className="hero-orb hero-orb-two" />
        <div className="mx-auto grid min-h-[650px] max-w-[1320px] items-center gap-6 px-4 pb-12 pt-16 sm:px-6 lg:grid-cols-[.92fr_1.08fr] lg:px-8 lg:py-16">
          <div className="relative z-10 max-w-[670px] animate-rise">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#713a99]/12 bg-[#f4ecfa] px-3.5 py-2 text-xs font-bold text-[#67308e]"><BadgeCheck className="size-4" /> Техника в наличии в Тюмени</span>
            <h1 className="mt-7 text-[clamp(44px,6vw,84px)] font-black leading-[.95] tracking-[-0.065em] text-[#21142d]">Техника, которую <span className="text-[#71349d]">не нужно ждать.</span></h1>
            <p className="mt-7 max-w-[570px] text-base leading-7 text-[#6e6377] sm:text-lg">Собираем лучшие предложения партнёрских складов в одном каталоге. Вы видите одну понятную цену и актуальное наличие — остальное берём на себя.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button onClick={scrollToCatalog} className="h-13 rounded-full bg-[#2b1244] px-7 text-[15px] text-white shadow-[0_16px_36px_rgba(43,18,68,.22)] hover:bg-[#452063]">Смотреть каталог <ArrowRight /></Button>
              <a href="https://t.me/take_phone72" target="_blank" rel="noreferrer" className="inline-flex h-13 items-center justify-center gap-2 rounded-full border border-[#2b1244]/12 bg-white px-7 text-[15px] font-semibold transition hover:border-[#71349d]/35 hover:bg-[#faf7fc]"><MessageCircle className="size-4" /> Написать менеджеру</a>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm font-semibold text-[#4f4458]"><span className="inline-flex items-center gap-2"><Check className="size-4 text-[#71349d]" /> Гарантия до 5 лет</span><span className="inline-flex items-center gap-2"><Check className="size-4 text-[#71349d]" /> Trade-in</span><span className="inline-flex items-center gap-2"><Check className="size-4 text-[#71349d]" /> Свой сервис</span></div>
          </div>
          <div className="relative min-h-[420px] animate-rise-delayed lg:min-h-[610px]">
            <div className="absolute inset-[7%_2%_5%_6%] rounded-[44px] border border-white/80 bg-[linear-gradient(145deg,#f7f1fb_0%,#eee2f6_60%,#faf8fc_100%)] shadow-[0_36px_90px_rgba(54,26,75,.12)]" />
            <span className="absolute right-[7%] top-[9%] z-20 rounded-full bg-white/80 px-4 py-2 text-xs font-bold text-[#513560] shadow-sm backdrop-blur">Обновлено 2 мин назад</span>
            <Image src="/take-phone-hero.png" alt="Флагманские смартфоны Take Phone" width={1200} height={1200} priority className="hero-product absolute inset-0 z-10 h-full w-full object-contain p-[5%]" />
            <div className="absolute bottom-[7%] left-[2%] z-20 rounded-[22px] border border-white/70 bg-white/82 p-4 shadow-[0_20px_60px_rgba(58,31,78,.16)] backdrop-blur-xl"><p className="text-[11px] font-bold uppercase tracking-[.12em] text-[#8d7a99]">Цена сегодня</p><p className="mt-1 text-xl font-black tracking-[-.03em]">от 62 990 ₽</p><p className="mt-1 text-xs text-[#75687e]">18 моделей в наличии</p></div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1320px] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mb-7 flex items-end justify-between gap-5"><div><p className="eyebrow">Категории</p><h2 className="section-title">Вся техника — в одном месте</h2></div><span className="hidden text-sm text-[#7a6f83] sm:block">Аксессуары подключаются отдельно</span></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map(({ label, meta, icon: Icon, active }) => (
            <button key={label} onClick={active ? scrollToCatalog : undefined} className={`group flex min-h-[150px] flex-col justify-between rounded-[26px] border p-5 text-left transition duration-300 ${active ? 'border-[#6e3597]/18 bg-[#2b1244] text-white shadow-[0_20px_45px_rgba(43,18,68,.15)]' : 'border-[#2f1945]/8 bg-white hover:-translate-y-1 hover:border-[#6e3597]/20 hover:shadow-[0_16px_40px_rgba(43,18,68,.07)]'}`}>
              <span className={`grid size-11 place-items-center rounded-2xl ${active ? 'bg-white/12' : 'bg-[#f4eef8] text-[#71349d]'}`}><Icon className="size-5" /></span>
              <span><span className="flex items-center justify-between text-lg font-bold"><span>{label}</span><ChevronRight className="size-4 opacity-55 transition group-hover:translate-x-1" /></span><span className={`mt-1 block text-xs ${active ? 'text-white/60' : 'text-[#908497]'}`}>{meta}</span></span>
            </button>
          ))}
        </div>
      </section>

      <section id="catalog" className="border-y border-[#2f1945]/8 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><p className="eyebrow">Каталог iPhone</p><h2 className="section-title">Актуально прямо сейчас</h2><p className="mt-3 max-w-[580px] text-sm leading-6 text-[#786c80]">Одинаковые позиции из разных магазинов объединяются, а на сайте показывается лучшая доступная цена с вашей наценкой.</p></div><div className="flex items-center gap-2 rounded-full bg-[#f4f0f7] px-4 py-2.5 text-xs font-semibold text-[#5e5167]"><span className="size-2 animate-pulse rounded-full bg-[#28a36a]" /> Демонстрационные данные</div></div>
          <div className="mt-9 rounded-[24px] border border-[#2f1945]/8 bg-[#faf8fc] p-3 sm:p-4"><div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
            <label className="flex h-11 items-center gap-3 rounded-[14px] border border-[#2f1945]/10 bg-white px-4"><Search className="size-4 text-[#82768b]" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm outline-none placeholder:text-[#978c9e]" placeholder="Название, память или цвет" />{query && <button onClick={() => setQuery('')} aria-label="Очистить поиск"><X className="size-4 text-[#95899d]" /></button>}</label>
            <FilterSelect label="Модель" value={generation} options={['Все', '17', '16', '15']} onChange={setGeneration} />
            <FilterSelect label="Память" value={memory} options={['Все', '128', '256', '512']} onChange={setMemory} />
            <button onClick={() => setOnlyAvailable((value) => !value)} className={`inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border px-4 text-sm font-semibold transition ${onlyAvailable ? 'border-[#6d3394] bg-[#efe3f7] text-[#5f2884]' : 'border-[#2f1945]/10 bg-white text-[#5d5265]'}`}><SlidersHorizontal className="size-4" /> Только в наличии</button>
          </div></div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <article key={product.id} className="product-card group flex min-h-[500px] flex-col overflow-hidden rounded-[28px] border border-[#2f1945]/8 bg-white p-3 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_64px_rgba(42,19,57,.11)]">
                <div className={`product-visual product-tone-${product.tone} relative grid h-[276px] place-items-center overflow-hidden rounded-[22px]`}>
                  <button className="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-full bg-white/82 text-[#735f7d] backdrop-blur transition hover:text-[#71349d]" aria-label="Добавить в избранное"><Heart className="size-4" /></button>
                  {product.oldPrice && <span className="absolute left-3 top-3 z-10 rounded-full bg-[#2b1244] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.08em] text-white">Выгодно</span>}
                  <Image src="/take-phone-product.png" alt={`${product.name}, ${product.color}`} width={1024} height={1536} className="h-[92%] w-[92%] object-contain transition duration-500 group-hover:scale-[1.035]" />
                </div>
                <div className="flex flex-1 flex-col px-2 pb-2 pt-5"><div className="flex items-center justify-between gap-2"><span className={`inline-flex items-center gap-1.5 text-xs font-bold ${product.stock === 'available' ? 'text-[#26875b]' : 'text-[#99741c]'}`}><span className={`size-1.5 rounded-full ${product.stock === 'available' ? 'bg-[#31ad70]' : 'bg-[#d2a735]'}`} />{product.stock === 'available' ? 'В наличии' : 'Под заказ'}</span><span className="text-[11px] text-[#9a8fa1]">обновлено сейчас</span></div><h3 className="mt-3 text-lg font-extrabold tracking-[-.03em]">{product.name}</h3><p className="mt-1 text-sm text-[#817589]">{product.memory} · {product.color}</p>
                  <div className="mt-auto flex items-end justify-between gap-3 pt-5"><div>{product.oldPrice && <p className="text-xs text-[#a69dac] line-through">{money(product.oldPrice)}</p>}<p className="text-xl font-black tracking-[-.03em]">{money(product.price)}</p></div><Button onClick={() => addToCart(product.id)} size="icon-lg" className="size-11 rounded-full bg-[#2b1244] text-white hover:bg-[#71349d]" aria-label={`Добавить ${product.name} в заявку`}>{cart.includes(product.id) ? <Check /> : <Plus />}</Button></div>
                  {product.stock === 'order' && <p className="mt-3 rounded-xl bg-[#f8f3e8] px-3 py-2 text-[11px] font-semibold text-[#8d6e27]">Под заказ на 1 000 ₽ дешевле</p>}
                </div>
              </article>
            ))}
          </div>
          {filteredProducts.length === 0 && <div className="mt-8 rounded-[28px] border border-dashed border-[#2f1945]/15 bg-[#faf8fc] p-12 text-center"><Search className="mx-auto size-7 text-[#9f92a7]" /><p className="mt-4 font-bold">Ничего не нашли</p><button onClick={() => { setQuery(''); setGeneration('Все'); setMemory('Все'); setOnlyAvailable(false); }} className="mt-2 text-sm font-semibold text-[#71349d]">Сбросить фильтры</button></div>}
        </div>
      </section>

      <section id="benefits" className="mx-auto max-w-[1320px] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-start"><div className="lg:sticky lg:top-28"><p className="eyebrow">Как это работает</p><h2 className="section-title max-w-[470px]">Один магазин вместо трёх вкладок</h2><p className="mt-5 max-w-[470px] text-base leading-7 text-[#776b7f]">Покупателю не нужно знать, откуда приедет устройство. Take Phone проверяет предложения, фиксирует лучшую цену и помогает с покупкой.</p><Button onClick={() => setStaffOpen(true)} variant="outline" className="mt-7 h-11 rounded-full border-[#2f1945]/12 px-5"><LockKeyhole /> Посмотреть режим сотрудника</Button></div>
          <div className="grid gap-4 sm:grid-cols-2"><Benefit icon={RefreshCw} number="01" title="Всегда актуально" text="Цена и наличие синхронизируются с партнёрскими магазинами автоматически." /><Benefit icon={CircleGauge} number="02" title="Лучшая цена" text="Система сравнивает доступные варианты и применяет заданную наценку." /><Benefit icon={PackageCheck} number="03" title="Одна карточка" text="Повторяющиеся модели объединяются — каталог остаётся чистым и понятным." /><Benefit icon={ShieldCheck} number="04" title="Поддержка после покупки" text="До 5 лет гарантии, собственный сервис и помощь с trade-in." /></div>
        </div>
      </section>

      <section id="store" className="mx-auto max-w-[1320px] px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
        <div className="overflow-hidden rounded-[34px] bg-[#2b1244] text-white"><div className="grid lg:grid-cols-[1.05fr_.95fr]">
          <div className="p-7 sm:p-10 lg:p-14"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#c9a4e3]">Магазин в Тюмени</p><h2 className="mt-4 text-[clamp(34px,4vw,58px)] font-black leading-[1] tracking-[-.055em]">Заберите сегодня на Герцена, 84к2</h2><div className="mt-9 grid gap-4 sm:grid-cols-2"><InfoRow icon={Clock3} title="Ежедневно" text="09:00–22:00" /><InfoRow icon={MapPin} title="Take Phone" text="Тюмень, Герцена, 84к2" /></div><div className="mt-9 flex flex-col gap-3 sm:flex-row"><a href="https://t.me/take_phone72" target="_blank" rel="noreferrer" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-[#2b1244] transition hover:bg-[#f2e8f8]"><MessageCircle className="size-4" /> Написать в Telegram</a><a href="tel:+73452499700" className="inline-flex h-12 items-center justify-center rounded-full border border-white/18 px-6 text-sm font-bold text-white transition hover:bg-white/8">+7 (3452) 499-700</a></div></div>
          <div className="relative min-h-[330px] overflow-hidden bg-[#dac9e5]"><div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,.9),transparent_31%),linear-gradient(135deg,#eaddf1,#b893cf)]" /><div className="absolute left-[12%] top-[17%] h-[70%] w-[76%] rounded-[28px] border border-white/60 bg-white/75 p-5 shadow-[0_30px_70px_rgba(34,15,50,.18)] backdrop-blur"><div className="h-full rounded-[20px] bg-[linear-gradient(135deg,#f2edf5,#ded2e6)] p-5 text-[#2b1244]"><div className="flex items-center justify-between"><span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-black tracking-[.12em]">TAKE PHONE</span><MapPin className="size-5" /></div><div className="mt-10 grid place-items-center"><div className="relative size-32 rounded-full border-[18px] border-white/55"><span className="absolute left-1/2 top-1/2 size-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#71349d] shadow-[0_0_0_10px_rgba(113,52,157,.13)]" /></div><p className="mt-5 text-center text-sm font-bold">Герцена, 84к2</p><p className="mt-1 text-center text-xs text-[#765d83]">Можно забрать заказ сегодня</p></div></div></div></div>
        </div></div>
      </section>

      <footer className="border-t border-[#2f1945]/8 bg-white"><div className="mx-auto flex max-w-[1320px] flex-col gap-5 px-4 py-8 text-sm text-[#7a6e82] sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8"><div><span className="font-black tracking-[-.03em] text-[#2b1244]">TAKE PHONE</span><span className="ml-3">Демо-концепция сайта</span></div><div className="flex flex-wrap gap-x-5 gap-y-2"><a href="https://t.me/Takephone72" target="_blank" rel="noreferrer" className="hover:text-[#71349d]">Telegram-канал</a><a href="https://vk.com/takephone72" target="_blank" rel="noreferrer" className="hover:text-[#71349d]">ВКонтакте</a><button onClick={() => setStaffOpen(true)} className="hover:text-[#71349d]">Сотрудникам</button></div></div></footer>

      <Sheet open={cartOpen} onOpenChange={setCartOpen}><SheetContent className="w-full overflow-y-auto border-l border-[#2f1945]/10 bg-white p-0 sm:max-w-[520px]"><SheetHeader className="border-b border-[#2f1945]/8 p-6"><SheetTitle className="text-2xl font-black tracking-[-.04em]">Оформление заявки</SheetTitle><SheetDescription>Оплата сейчас не требуется — менеджер свяжется и подтвердит наличие.</SheetDescription></SheetHeader>
        {orderSent ? <div className="grid flex-1 place-items-center p-8 text-center"><div><span className="mx-auto grid size-16 place-items-center rounded-full bg-[#e8f7ef] text-[#258356]"><Check className="size-7" /></span><h3 className="mt-5 text-2xl font-black tracking-[-.04em]">Заявка принята</h3><p className="mx-auto mt-3 max-w-[330px] leading-6 text-[#776b80]">Это демонстрация интерфейса. В рабочей версии заявка уйдёт менеджеру Take Phone.</p><Button onClick={() => { setOrderSent(false); setCartOpen(false); }} className="mt-6 h-11 rounded-full bg-[#2b1244] px-6 text-white">Вернуться в каталог</Button></div></div>
        : cartProducts.length === 0 ? <div className="grid flex-1 place-items-center p-8 text-center"><div><ShoppingBag className="mx-auto size-8 text-[#a99daf]" /><h3 className="mt-4 text-lg font-bold">В заявке пока пусто</h3><p className="mt-2 text-sm text-[#82768b]">Добавьте модель из каталога — достаточно одного нажатия.</p><Button onClick={() => { setCartOpen(false); scrollToCatalog(); }} className="mt-5 rounded-full bg-[#2b1244] px-5 text-white">Перейти в каталог</Button></div></div>
        : <form onSubmit={submitOrder} className="flex flex-1 flex-col"><div className="space-y-6 p-6"><div className="space-y-3">{cartProducts.map((product) => <CartRow key={product.id} product={product} onRemove={() => setCart((current) => current.filter((id) => id !== product.id))} />)}</div><div><p className="form-label">Как получить</p><div className="mt-2 grid grid-cols-2 gap-2"><ChoiceButton selected={delivery === 'pickup'} onClick={() => setDelivery('pickup')} icon={Store} title="Самовывоз" subtitle="Герцена, 84к2" /><ChoiceButton selected={delivery === 'delivery'} onClick={() => setDelivery('delivery')} icon={Truck} title="Доставка" subtitle="По Тюмени" /></div></div><div><p className="form-label">Способ оплаты</p><div className="mt-2 space-y-2"><PaymentButton selected={payment === 'transfer'} onClick={() => setPayment('transfer')} icon={WalletCards} title="Перевод при получении" note="Без доплаты" /><PaymentButton selected={payment === 'cash'} onClick={() => setPayment('cash')} icon={Store} title="Наличными" note="В магазине" /><PaymentButton selected={payment === 'card'} onClick={() => setPayment('card')} icon={CreditCard} title="Оплата картой" note="К цене +13,5%" /></div></div><div className="grid gap-3 sm:grid-cols-2"><label htmlFor="order-name"><span className="form-label">Ваше имя</span><Input id="order-name" required placeholder="Артём" className="mt-2 h-11 rounded-xl" /></label><label htmlFor="order-phone"><span className="form-label">Телефон</span><Input id="order-phone" required type="tel" placeholder="+7 999 000-00-00" className="mt-2 h-11 rounded-xl" /></label></div></div><div className="mt-auto border-t border-[#2f1945]/8 bg-[#faf8fc] p-6"><div className="flex items-end justify-between"><span className="text-sm text-[#75697e]">Итого ориентировочно</span><strong className="text-2xl tracking-[-.04em]">{money(paymentTotal)}</strong></div>{payment === 'card' && <p className="mt-1 text-right text-xs text-[#9274a3]">включена комиссия 13,5%</p>}<Button type="submit" className="mt-4 h-12 w-full rounded-full bg-[#2b1244] text-white hover:bg-[#71349d]">Отправить заявку <ArrowRight /></Button><p className="mt-3 text-center text-[11px] leading-4 text-[#988da0]">Менеджер подтвердит итоговую цену и наличие перед покупкой</p></div></form>}
      </SheetContent></Sheet>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}><SheetContent side="left" className="w-[88%] border-r border-[#2f1945]/10 bg-white p-0 sm:max-w-[360px]"><SheetHeader className="border-b border-[#2f1945]/8 p-6"><SheetTitle className="text-xl font-black">TAKE PHONE</SheetTitle><SheetDescription>Магазин техники в Тюмени</SheetDescription></SheetHeader><nav className="grid gap-2 p-4 text-base font-bold"><button onClick={() => { setMobileOpen(false); scrollToCatalog(); }} className="flex items-center justify-between rounded-2xl p-4 text-left hover:bg-[#f6f1f9]">Каталог <ChevronRight /></button><a href="#benefits" onClick={() => setMobileOpen(false)} className="flex items-center justify-between rounded-2xl p-4 hover:bg-[#f6f1f9]">Преимущества <ChevronRight /></a><a href="#store" onClick={() => setMobileOpen(false)} className="flex items-center justify-between rounded-2xl p-4 hover:bg-[#f6f1f9]">Магазин <ChevronRight /></a><button onClick={() => { setMobileOpen(false); setStaffOpen(true); }} className="flex items-center justify-between rounded-2xl p-4 text-left hover:bg-[#f6f1f9]">Для сотрудников <LockKeyhole /></button></nav></SheetContent></Sheet>

      <Dialog open={staffOpen} onOpenChange={setStaffOpen}><DialogContent className="max-h-[88vh] max-w-[960px] overflow-y-auto rounded-[26px] border border-[#2f1945]/10 bg-white p-0 shadow-[0_36px_100px_rgba(28,13,39,.28)]"><DialogHeader className="border-b border-[#2f1945]/8 p-6 pr-14 sm:p-8"><div className="mb-2 flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#eee3f5] px-3 py-1 text-[10px] font-black uppercase tracking-[.12em] text-[#632b89]">Демо-режим</span><span className="inline-flex items-center gap-1.5 text-xs text-[#3d865f]"><span className="size-1.5 rounded-full bg-[#37ad72]" /> Синхронизация работает</span></div><DialogTitle className="text-2xl font-black tracking-[-.04em] sm:text-3xl">Панель сотрудника</DialogTitle><DialogDescription className="max-w-[680px] leading-6">Покупатель не видит поставщиков. Здесь сотрудник понимает, в каком магазине выкупить товар, и может изменить общую наценку.</DialogDescription></DialogHeader>
        <div className="p-6 sm:p-8"><div className="grid gap-4 lg:grid-cols-[1fr_230px]"><div className="rounded-[22px] border border-[#2f1945]/9 p-5"><div className="flex items-center gap-4"><div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[#f1e8f6]"><Smartphone className="size-6 text-[#6d3394]" /></div><div><p className="font-extrabold">iPhone 17 Pro Max · 256 ГБ</p><p className="mt-1 text-xs text-[#897d91]">Deep Violet · объединено 3 предложения</p></div></div><div className="mt-5 overflow-hidden rounded-2xl border border-[#2f1945]/8">{products[0].suppliers.map((supplier, index) => <div key={supplier.name} className={`grid grid-cols-[1fr_auto] gap-4 px-4 py-3 text-sm ${index ? 'border-t border-[#2f1945]/7' : ''} ${supplier.price === 114990 ? 'bg-[#f5eef9]' : 'bg-white'}`}><div><span className="font-bold">{supplier.name}</span><span className={`ml-2 text-xs ${supplier.stock ? 'text-[#2d8a5f]' : 'text-[#9e7622]'}`}>{supplier.stock ? 'в наличии' : 'нет в наличии'}</span><p className="mt-1 text-[11px] text-[#978b9e]">{supplier.updated}</p></div><div className="text-right"><p className="font-extrabold">{money(supplier.price)}</p>{supplier.price === 114990 && <span className="text-[10px] font-bold text-[#6d3394]">ЛУЧШИЙ ВАРИАНТ</span>}</div></div>)}</div></div>
          <div className="rounded-[22px] bg-[#2b1244] p-5 text-white"><p className="text-xs font-bold uppercase tracking-[.12em] text-white/55">Наценка</p><div className="mt-5 flex items-center justify-between rounded-2xl bg-white/8 p-2"><button onClick={() => setMarkup((value) => Math.max(0, value - 500))} className="grid size-9 place-items-center rounded-xl bg-white/10 hover:bg-white/15"><Minus className="size-4" /></button><strong className="text-xl">{money(markup)}</strong><button onClick={() => setMarkup((value) => value + 500)} className="grid size-9 place-items-center rounded-xl bg-white/10 hover:bg-white/15"><Plus className="size-4" /></button></div><div className="mt-5 space-y-3 text-sm"><div className="flex justify-between text-white/65"><span>Закупка</span><span>{money(114990)}</span></div><div className="flex justify-between border-t border-white/10 pt-3"><span>Цена на сайте</span><strong>{money(114990 + markup)}</strong></div></div><p className="mt-5 rounded-xl bg-white/8 p-3 text-[11px] leading-5 text-white/65">В рабочей версии наценку можно задавать для категории, модели или отдельного товара.</p></div></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3"><StaffMetric value="186" label="позиций собрано" /><StaffMetric value="18" label="изменений за час" /><StaffMetric value="3" label="источника онлайн" /></div>
        </div>
      </DialogContent></Dialog>
    </main>
  );
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label className="flex h-11 min-w-[150px] items-center gap-2 rounded-[14px] border border-[#2f1945]/10 bg-white px-3 text-sm"><span className="text-[#8b7f92]">{label}:</span><select value={value} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 bg-transparent font-bold outline-none">{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
}

function Benefit({ icon: Icon, number, title, text }: { icon: typeof RefreshCw; number: string; title: string; text: string }) {
  return <article className="min-h-[255px] rounded-[28px] border border-[#2f1945]/8 bg-white p-6 shadow-[0_16px_46px_rgba(42,19,57,.045)] sm:p-7"><div className="flex items-start justify-between"><span className="grid size-12 place-items-center rounded-2xl bg-[#f1e8f6] text-[#6d3394]"><Icon className="size-5" /></span><span className="text-xs font-black tracking-[.12em] text-[#c0b5c6]">{number}</span></div><h3 className="mt-9 text-xl font-black tracking-[-.035em]">{title}</h3><p className="mt-3 text-sm leading-6 text-[#7a6e82]">{text}</p></article>;
}

function InfoRow({ icon: Icon, title, text }: { icon: typeof Clock3; title: string; text: string }) {
  return <div className="flex items-center gap-3 rounded-2xl bg-white/8 p-4"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10"><Icon className="size-4" /></span><div><p className="text-xs text-white/55">{title}</p><p className="mt-1 text-sm font-bold">{text}</p></div></div>;
}

function CartRow({ product, onRemove }: { product: Product; onRemove: () => void }) {
  return <div className="flex items-center gap-3 rounded-2xl border border-[#2f1945]/8 p-3"><div className={`product-tone-${product.tone} grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl`}><Image src="/take-phone-product.png" alt="" width={1024} height={1536} className="h-[88%] w-[88%] object-contain" /></div><div className="min-w-0 flex-1"><p className="truncate font-bold">{product.name}</p><p className="mt-1 text-xs text-[#8d8195]">{product.memory} · {product.color}</p><p className="mt-2 font-black">{money(product.price)}</p></div><button type="button" onClick={onRemove} className="grid size-8 place-items-center rounded-full text-[#978b9e] hover:bg-[#f4eef7] hover:text-[#5d2a80]" aria-label="Удалить из заявки"><X className="size-4" /></button></div>;
}

function ChoiceButton({ selected, onClick, icon: Icon, title, subtitle }: { selected: boolean; onClick: () => void; icon: typeof Store; title: string; subtitle: string }) {
  return <button type="button" onClick={onClick} className={`rounded-2xl border p-4 text-left transition ${selected ? 'border-[#71349d] bg-[#f3eaf8]' : 'border-[#2f1945]/10 bg-white hover:bg-[#faf8fc]'}`}><Icon className={`size-5 ${selected ? 'text-[#71349d]' : 'text-[#8d8195]'}`} /><p className="mt-4 text-sm font-bold">{title}</p><p className="mt-1 text-[11px] text-[#8d8195]">{subtitle}</p></button>;
}

function PaymentButton({ selected, onClick, icon: Icon, title, note }: { selected: boolean; onClick: () => void; icon: typeof CreditCard; title: string; note: string }) {
  return <button type="button" onClick={onClick} className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${selected ? 'border-[#71349d] bg-[#f3eaf8]' : 'border-[#2f1945]/10 bg-white hover:bg-[#faf8fc]'}`}><span className="grid size-9 place-items-center rounded-xl bg-white"><Icon className="size-4 text-[#71349d]" /></span><span className="flex-1 text-sm font-bold">{title}</span><span className="text-[11px] text-[#8c8094]">{note}</span>{selected && <Check className="size-4 text-[#71349d]" />}</button>;
}

function StaffMetric({ value, label }: { value: string; label: string }) {
  return <div className="rounded-2xl border border-[#2f1945]/8 bg-[#faf8fc] p-4"><p className="text-2xl font-black tracking-[-.04em]">{value}</p><p className="mt-1 text-xs text-[#8b7f93]">{label}</p></div>;
}
