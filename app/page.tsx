'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronRight,
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
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
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
  image: string;
  imageMode: 'cover' | 'contain';
  suppliers: Supplier[];
};

const products: Product[] = [
  { id: 1, name: 'iPhone 17 Pro Max', generation: 'Pro Max', memory: '256 ГБ', color: 'Deep Blue eSIM', price: 119990, oldPrice: 126490, stock: 'available', image: '/iphone-17-pro-max-blue.jpg', imageMode: 'cover', suppliers: [
    { name: 'First Apple', price: 114990, stock: true, updated: '2 мин назад' },
    { name: 'IceApple', price: 116490, stock: true, updated: '4 мин назад' },
    { name: 'Phone24', price: 115990, stock: true, updated: '7 мин назад' },
  ] },
  { id: 2, name: 'iPhone 17 Pro', generation: 'Pro', memory: '256 ГБ', color: 'Silver eSIM', price: 109990, oldPrice: 115490, stock: 'available', image: '/iphone-17-pro-silver.jpg', imageMode: 'cover', suppliers: [
    { name: 'First Apple', price: 104990, stock: true, updated: '2 мин назад' },
    { name: 'IceApple', price: 105490, stock: true, updated: '4 мин назад' },
    { name: 'Phone24', price: 106190, stock: false, updated: '6 мин назад' },
  ] },
  { id: 3, name: 'iPhone 17 Pro Max', generation: 'Pro Max', memory: '512 ГБ', color: 'Cosmic Orange eSIM', price: 139990, stock: 'available', image: '/iphone-17-pro-orange.jpg', imageMode: 'cover', suppliers: [
    { name: 'First Apple', price: 134990, stock: false, updated: '3 мин назад' },
    { name: 'IceApple', price: 134990, stock: true, updated: '5 мин назад' },
    { name: 'Phone24', price: 136490, stock: true, updated: '8 мин назад' },
  ] },
  { id: 4, name: 'iPhone 17', generation: '17', memory: '256 ГБ', color: 'Lavender eSIM', price: 94990, oldPrice: 99990, stock: 'available', image: '/iphone-17-lavender.png', imageMode: 'contain', suppliers: [
    { name: 'First Apple', price: 89990, stock: true, updated: '2 мин назад' },
    { name: 'IceApple', price: 91490, stock: true, updated: '4 мин назад' },
    { name: 'Phone24', price: 90990, stock: false, updated: '9 мин назад' },
  ] },
  { id: 5, name: 'iPhone 17', generation: '17', memory: '256 ГБ', color: 'Mist Blue eSIM', price: 94990, stock: 'order', image: '/iphone-17-mistblue.png', imageMode: 'contain', suppliers: [
    { name: 'First Apple', price: 89990, stock: false, updated: '2 мин назад' },
    { name: 'IceApple', price: 89990, stock: true, updated: '4 мин назад' },
    { name: 'Phone24', price: 91490, stock: false, updated: '7 мин назад' },
  ] },
  { id: 6, name: 'iPhone Air', generation: 'Air', memory: '256 ГБ', color: 'Sky Blue eSIM', price: 99990, stock: 'available', image: '/iphone-air.jpg', imageMode: 'cover', suppliers: [
    { name: 'First Apple', price: 94990, stock: true, updated: '3 мин назад' },
    { name: 'IceApple', price: 95990, stock: true, updated: '6 мин назад' },
    { name: 'Phone24', price: 96490, stock: true, updated: '8 мин назад' },
  ] },
];

const money = (value: number) => `${new Intl.NumberFormat('ru-RU').format(value)} ₽`;

export default function Home() {
  const [query, setQuery] = useState('');
  const [model, setModel] = useState('Все');
  const [memory, setMemory] = useState('Все');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [cart, setCart] = useState<number[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [staffOpen, setStaffOpen] = useState(false);
  const [orderSent, setOrderSent] = useState(false);
  const [delivery, setDelivery] = useState<'pickup' | 'delivery'>('pickup');
  const [payment, setPayment] = useState<'transfer' | 'cash' | 'card'>('transfer');
  const [markup, setMarkup] = useState(5000);

  const filtered = useMemo(() => products.filter((product) => {
    const haystack = `${product.name} ${product.memory} ${product.color}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase())
      && (model === 'Все' || product.generation === model)
      && (memory === 'Все' || product.memory.startsWith(memory))
      && (!onlyAvailable || product.stock === 'available');
  }), [query, model, memory, onlyAvailable]);

  const cartProducts = products.filter((product) => cart.includes(product.id));
  const subtotal = cartProducts.reduce((sum, product) => sum + product.price, 0);
  const total = payment === 'card' ? Math.round(subtotal * 1.135) : subtotal;
  const goCatalog = () => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
  const addProduct = (id: number) => { setCart((current) => current.includes(id) ? current : [...current, id]); setCartOpen(true); };

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-[#19151d]">
      <div className="sync-bar"><div className="ticker-track"><span>Цены обновляются автоматически</span><span>● 18 моделей в наличии</span><span>Самовывоз сегодня на Герцена, 84к2</span><span>Цены обновляются автоматически</span><span>● 18 моделей в наличии</span><span>Самовывоз сегодня на Герцена, 84к2</span></div></div>

      <header className="sticky top-0 z-40 border-b border-black/[.07] bg-white/92 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1380px] items-center gap-6 px-5 lg:px-8">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="shrink-0 text-left leading-none" aria-label="Take Phone — наверх"><span className="block text-[19px] font-black tracking-[-.055em]">TAKE PHONE</span><span className="mt-1.5 block text-[8px] font-bold uppercase tracking-[.24em] text-[#7d6f83]">Магазин техники · Тюмень</span></button>
          <nav className="ml-6 hidden items-center gap-7 text-[13px] font-semibold text-black/52 lg:flex"><button onClick={goCatalog} className="hover:text-[#6d3b7e]">Каталог</button><a href="#how" className="hover:text-[#6d3b7e]">Как купить</a><a href="#service" className="hover:text-[#6d3b7e]">Гарантия и сервис</a><a href="#contacts" className="hover:text-[#6d3b7e]">Контакты</a></nav>
          <label className="ml-auto hidden h-11 w-full max-w-[300px] items-center gap-3 rounded-full bg-[#f3f1f4] px-4 md:flex"><Search className="size-4 text-black/35"/><input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm outline-none placeholder:text-black/32" placeholder="Найти устройство"/></label>
          <button onClick={() => setStaffOpen(true)} className="hidden h-11 items-center gap-2 rounded-full px-3 text-xs font-semibold text-black/45 hover:bg-[#f5f3f6] sm:flex"><UserRoundCog className="size-4"/><span className="hidden xl:block">Сотрудникам</span></button>
          <button onClick={() => setCartOpen(true)} className="relative flex h-11 items-center gap-2 rounded-full bg-[#2b1635] px-5 text-xs font-bold text-white transition hover:bg-[#5e326e]"><ShoppingBag className="size-4"/><span className="hidden sm:inline">Заявка</span>{cart.length > 0 && <span className="grid size-5 place-items-center rounded-full bg-white text-[9px] text-[#2b1635]">{cart.length}</span>}</button>
          <button onClick={() => setMobileOpen(true)} className="grid size-11 place-items-center rounded-full border border-black/10 lg:hidden"><Menu className="size-4"/></button>
        </div>
      </header>

      <section className="relative bg-[#f5f5f7]">
        <div className="mx-auto grid min-h-[670px] max-w-[1380px] items-center gap-8 px-5 py-14 lg:grid-cols-[.76fr_1.24fr] lg:px-8 lg:py-16">
          <div className="relative z-10 max-w-[590px] animate-copy-in">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#eee7f1] px-3.5 py-2 text-[11px] font-bold text-[#683a79]"><BadgeCheck className="size-4"/> Новая линейка уже в Тюмени</span>
            <h1 className="mt-7 text-[clamp(52px,6.2vw,88px)] font-black leading-[.92] tracking-[-.075em]">iPhone 17 Pro.<br/><span className="text-[#784888]">Реально в наличии.</span></h1>
            <p className="mt-7 max-w-[520px] text-base leading-7 text-black/52 sm:text-lg">Актуальные цены и наличие — в одном каталоге. Вы выбираете устройство, а менеджер Take Phone подтверждает заказ и удобный способ получения.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row"><button onClick={goCatalog} className="group inline-flex h-13 items-center justify-center gap-8 rounded-full bg-[#2b1635] px-7 text-xs font-black text-white transition hover:bg-[#5f326f]">Смотреть каталог <ArrowRight className="size-4 transition group-hover:translate-x-1"/></button><a href="https://t.me/take_phone72" target="_blank" rel="noreferrer" className="inline-flex h-13 items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-7 text-xs font-bold text-black/65 hover:border-[#7c518a]/35"><MessageCircle className="size-4"/> Спросить менеджера</a></div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-black/50"><span className="flex items-center gap-2"><Check className="size-3.5 text-[#704081]"/> Гарантия до 5 лет</span><span className="flex items-center gap-2"><Check className="size-3.5 text-[#704081]"/> Собственный сервис</span><span className="flex items-center gap-2"><Check className="size-3.5 text-[#704081]"/> Trade-in</span></div>
          </div>
          <div className="hero-photo-wrap relative min-h-[440px] overflow-hidden rounded-[32px] bg-[#efeff1] lg:min-h-[590px]"><Image src="/iphone-17-pro-hero.jpg" alt="Официальная линейка iPhone 17 Pro" fill priority className="hero-photo object-cover object-center"/><div className="absolute bottom-5 left-5 rounded-[18px] bg-white/90 p-4 shadow-[0_14px_45px_rgba(31,21,34,.12)] backdrop-blur"><p className="text-[10px] font-bold uppercase tracking-[.13em] text-black/35">iPhone 17 Pro Max</p><p className="mt-1 text-lg font-black">от 119 990 ₽</p><p className="mt-1 text-[10px] font-semibold text-[#31805a]">● В наличии сегодня</p></div></div>
        </div>
      </section>

      <section className="border-y border-black/[.07] bg-white"><div className="mx-auto grid max-w-[1380px] grid-cols-2 divide-x divide-black/[.07] px-5 md:grid-cols-4 lg:px-8"><MiniStat value="18" text="моделей в наличии"/><MiniStat value="сегодня" text="самовывоз из магазина"/><MiniStat value="Trade-in" text="любых брендов"/><MiniStat value="5 лет" text="гарантии Take Phone"/></div></section>

      <section className="mx-auto max-w-[1380px] px-5 py-16 lg:px-8 lg:py-20">
        <Reveal><div className="mb-8 flex items-end justify-between gap-5"><div><p className="section-label">Категории</p><h2 className="section-heading">Выберите технику</h2></div><p className="hidden max-w-[420px] text-right text-sm leading-6 text-black/42 md:block">В тестовой версии открыт каталог iPhone. Остальные категории подключаются следующим этапом.</p></div></Reveal>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Category icon={Smartphone} title="iPhone" meta="6 моделей в демо" active onClick={goCatalog}/><Category icon={Laptop} title="Mac" meta="Следующий этап"/><Category icon={Watch} title="Apple Watch" meta="Следующий этап"/><Category icon={Headphones} title="AirPods" meta="Следующий этап"/></div>
      </section>

      <section id="catalog" className="bg-[#f5f4f6] py-20 lg:py-24">
        <div className="mx-auto max-w-[1380px] px-5 lg:px-8">
          <Reveal><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="section-label">Каталог iPhone</p><h2 className="section-heading">Актуально сейчас</h2></div><span className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2 text-[11px] font-semibold text-black/48"><span className="sync-dot size-2 rounded-full bg-[#30a267]"/> Демонстрационные данные</span></div></Reveal>
          <div className="mt-8 grid gap-2 rounded-[20px] border border-black/[.07] bg-white p-3 lg:grid-cols-[1fr_auto_auto_auto]">
            <label className="flex h-12 items-center gap-3 rounded-[13px] bg-[#f5f3f6] px-4"><Search className="size-4 text-black/35"/><input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm outline-none placeholder:text-black/30" placeholder="Название, память или цвет"/>{query && <button onClick={() => setQuery('')} aria-label="Очистить поиск"><X className="size-4 text-black/35"/></button>}</label>
            <Filter label="Модель" value={model} onChange={setModel} options={['Все','Pro Max','Pro','17','Air']}/><Filter label="Память" value={memory} onChange={setMemory} options={['Все','256','512']}/><button onClick={() => setOnlyAvailable((value) => !value)} className={`h-12 rounded-[13px] px-5 text-xs font-bold transition ${onlyAvailable ? 'bg-[#eee5f2] text-[#673578]' : 'bg-[#f5f3f6] text-black/48 hover:text-black/70'}`}>{onlyAvailable ? '✓ Только в наличии' : 'Только в наличии'}</button>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((product, index) => <Reveal key={product.id} delay={Math.min(index * 70, 280)}><ProductCard product={product} selected={cart.includes(product.id)} onAdd={() => addProduct(product.id)}/></Reveal>)}
          </div>
          {filtered.length === 0 && <div className="mt-6 rounded-[24px] border border-dashed border-black/12 bg-white py-20 text-center"><Search className="mx-auto size-6 text-black/25"/><p className="mt-4 font-black">Ничего не найдено</p><button onClick={() => { setQuery(''); setModel('Все'); setMemory('Все'); setOnlyAvailable(false); }} className="mt-3 text-xs font-bold text-[#713f82]">Сбросить фильтры</button></div>}
        </div>
      </section>

      <section id="how" className="bg-[#25152d] py-20 text-white lg:py-28">
        <div className="mx-auto max-w-[1380px] px-5 lg:px-8">
          <Reveal><div className="grid gap-8 lg:grid-cols-[.85fr_1.15fr] lg:items-end"><div><p className="section-label !text-[#c59fd2]">Как купить</p><h2 className="section-heading !text-white">Без сложного оформления</h2></div><p className="max-w-[620px] text-base leading-7 text-white/52">Выберите устройство и оставьте номер телефона. Менеджер проверит наличие, зафиксирует итоговую цену и договорится о получении.</p></div></Reveal>
          <div className="mt-14 grid gap-px overflow-hidden rounded-[24px] bg-white/10 md:grid-cols-3"><Step number="01" title="Выберите" text="Найдите нужную модель, объём памяти и цвет в актуальном каталоге."/><Step number="02" title="Оставьте заявку" text="Укажите телефон, способ получения и удобный вариант оплаты."/><Step number="03" title="Получите" text="Менеджер всё подтвердит — заберите устройство в магазине или закажите доставку."/></div>
        </div>
      </section>

      <section id="service" className="bg-white py-20 lg:py-28"><div className="mx-auto grid max-w-[1380px] gap-12 px-5 lg:grid-cols-[.95fr_1.05fr] lg:items-center lg:px-8"><Reveal><div><p className="section-label">После покупки</p><h2 className="section-heading">Сервис остаётся рядом</h2><p className="mt-5 max-w-[560px] text-base leading-7 text-black/48">Пять лет гарантии подкреплены собственным сервисом в магазине. Здесь помогут с настройкой, диагностикой, ремонтом и trade-in.</p><div className="mt-9 flex flex-wrap gap-3"><ServiceChip icon={ShieldCheck} text="Гарантия до 5 лет"/><ServiceChip icon={RefreshCw} text="Trade-in любых брендов"/><ServiceChip icon={Store} text="Сервис в магазине"/></div></div></Reveal><Reveal delay={100}><div className="relative overflow-hidden rounded-[28px] bg-[#f1edf3] p-8 sm:p-10"><p className="text-[clamp(96px,16vw,210px)] font-black leading-[.75] tracking-[-.1em] text-[#2b1635]">5</p><p className="mt-8 text-3xl font-black tracking-[-.05em]">лет спокойствия</p><p className="mt-3 max-w-[370px] text-sm leading-6 text-black/45">Не просто гарантийный талон — специалисты, которым можно принести устройство лично.</p></div></Reveal></div></section>

      <section id="contacts" className="bg-[#f4f2f5] py-20 lg:py-24"><div className="mx-auto grid max-w-[1380px] gap-5 px-5 lg:grid-cols-[1.1fr_.9fr] lg:px-8"><Reveal><div className="h-full rounded-[28px] bg-[#2b1635] p-8 text-white sm:p-11"><p className="section-label !text-[#c9a9d4]">Take Phone · Тюмень</p><h2 className="mt-4 text-[clamp(44px,5.5vw,74px)] font-black leading-[.94] tracking-[-.065em]">Заберите устройство сегодня</h2><div className="mt-10 grid gap-3 sm:grid-cols-2"><Contact icon={MapPin} label="Адрес" value="Герцена, 84к2"/><Contact icon={Clock3} label="Режим работы" value="Ежедневно, 09:00–22:00"/></div><div className="mt-9 flex flex-col gap-3 sm:flex-row"><a href="https://t.me/take_phone72" target="_blank" rel="noreferrer" className="inline-flex h-13 items-center justify-center gap-2 rounded-full bg-white px-6 text-xs font-black text-[#2b1635]"><MessageCircle className="size-4"/> Написать в Telegram</a><a href="tel:+73452499700" className="inline-flex h-13 items-center justify-center rounded-full border border-white/16 px-6 text-xs font-bold text-white">+7 (3452) 499-700</a></div></div></Reveal><Reveal delay={100}><div className="relative h-full min-h-[390px] overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_28%_24%,#ffffff_0%,#e8ddea_38%,#ccb8d2_100%)] p-7"><div className="absolute left-[12%] top-[16%] h-[68%] w-[76%] rotate-[-3deg] rounded-[24px] border border-white/70 bg-white/76 p-5 shadow-[0_30px_80px_rgba(54,28,66,.18)] backdrop-blur"><div className="flex items-center justify-between"><span className="text-xs font-black">TAKE PHONE</span><MapPin className="size-5 text-[#704080]"/></div><div className="mt-12 grid place-items-center"><span className="relative grid size-32 place-items-center rounded-full border-[16px] border-[#e9dfee]"><span className="sync-dot size-7 rounded-full bg-[#704080] shadow-[0_0_0_10px_rgba(112,64,128,.14)]"/></span><p className="mt-6 text-center text-sm font-black">Тюмень, Герцена, 84к2</p><p className="mt-2 text-center text-xs text-black/42">Самовывоз сегодня до 22:00</p></div></div></div></Reveal></div></section>

      <footer className="border-t border-black/[.07] bg-white"><div className="mx-auto flex max-w-[1380px] flex-col gap-5 px-5 py-8 text-xs text-black/40 sm:flex-row sm:items-center sm:justify-between lg:px-8"><div><strong className="mr-3 text-[#2b1635]">TAKE PHONE</strong>Демонстрационная версия</div><div className="flex gap-5"><a href="https://t.me/Takephone72" target="_blank" rel="noreferrer">Telegram</a><a href="https://vk.com/takephone72" target="_blank" rel="noreferrer">ВКонтакте</a><button onClick={() => setStaffOpen(true)}>Сотрудникам</button></div></div></footer>

      <Sheet open={cartOpen} onOpenChange={setCartOpen}><SheetContent className="w-full overflow-y-auto border-l border-black/10 bg-white p-0 text-[#19151d] sm:max-w-[540px]"><SheetHeader className="border-b border-black/[.07] p-7"><SheetTitle className="text-2xl font-black tracking-[-.04em]">Оформление заявки</SheetTitle><SheetDescription>Менеджер подтвердит наличие и итоговую цену. Оплата на сайте не требуется.</SheetDescription></SheetHeader>{orderSent ? <Success onClose={() => { setOrderSent(false); setCartOpen(false); }}/>: cartProducts.length === 0 ? <EmptyCart onCatalog={() => { setCartOpen(false); goCatalog(); }}/>: <form onSubmit={(event) => { event.preventDefault(); setOrderSent(true); }} className="flex flex-1 flex-col"><div className="space-y-7 p-7"><div className="space-y-3">{cartProducts.map((product) => <CartRow key={product.id} product={product} onRemove={() => setCart((current) => current.filter((id) => id !== product.id))}/>)}</div><div><p className="form-label">Как получить</p><div className="mt-3 grid grid-cols-2 gap-2"><Choice active={delivery === 'pickup'} onClick={() => setDelivery('pickup')} icon={Store} title="Самовывоз" note="Герцена, 84к2"/><Choice active={delivery === 'delivery'} onClick={() => setDelivery('delivery')} icon={Truck} title="Доставка" note="По Тюмени"/></div></div><div><p className="form-label">Способ оплаты</p><div className="mt-3 space-y-2"><Payment active={payment === 'transfer'} onClick={() => setPayment('transfer')} icon={WalletCards} title="Перевод при получении" note="Без доплаты"/><Payment active={payment === 'cash'} onClick={() => setPayment('cash')} icon={Store} title="Наличными" note="В магазине"/><Payment active={payment === 'card'} onClick={() => setPayment('card')} icon={CreditCard} title="Оплата картой" note="+13,5%"/></div></div><div className="grid gap-4 sm:grid-cols-2"><label htmlFor="real-name"><span className="form-label">Ваше имя</span><Input id="real-name" required placeholder="Артём" className="mt-2 h-11 rounded-xl"/></label><label htmlFor="real-phone"><span className="form-label">Телефон</span><Input id="real-phone" required type="tel" placeholder="+7 999 000-00-00" className="mt-2 h-11 rounded-xl"/></label></div></div><div className="mt-auto border-t border-black/[.07] bg-[#f7f5f8] p-7"><div className="flex items-end justify-between"><span className="text-xs text-black/42">Итого ориентировочно</span><strong className="text-2xl tracking-[-.04em]">{money(total)}</strong></div>{payment === 'card' && <p className="mt-2 text-right text-[10px] text-[#764587]">Включена комиссия 13,5%</p>}<Button type="submit" className="mt-5 h-13 w-full rounded-full bg-[#2b1635] text-xs font-bold text-white">Отправить заявку <ArrowRight/></Button></div></form>}</SheetContent></Sheet>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}><SheetContent side="left" className="w-[88%] border-r border-black/10 bg-white p-0 text-[#19151d] sm:max-w-[380px]"><SheetHeader className="border-b border-black/[.07] p-7"><SheetTitle className="text-xl font-black tracking-[-.04em]">TAKE PHONE</SheetTitle><SheetDescription>Магазин техники в Тюмени</SheetDescription></SheetHeader><nav className="grid divide-y divide-black/[.07] text-sm font-bold"><button onClick={() => { setMobileOpen(false); goCatalog(); }} className="flex h-16 items-center justify-between px-7">Каталог <ChevronRight/></button><a href="#how" onClick={() => setMobileOpen(false)} className="flex h-16 items-center justify-between px-7">Как купить <ChevronRight/></a><a href="#service" onClick={() => setMobileOpen(false)} className="flex h-16 items-center justify-between px-7">Гарантия и сервис <ChevronRight/></a><a href="#contacts" onClick={() => setMobileOpen(false)} className="flex h-16 items-center justify-between px-7">Контакты <ChevronRight/></a><button onClick={() => { setMobileOpen(false); setStaffOpen(true); }} className="flex h-16 items-center justify-between px-7">Сотрудникам <LockKeyhole/></button></nav></SheetContent></Sheet>

      <Dialog open={staffOpen} onOpenChange={setStaffOpen}><DialogContent className="max-h-[90vh] max-w-[960px] overflow-y-auto rounded-[26px] border border-black/10 bg-white p-0 text-[#19151d] shadow-[0_36px_110px_rgba(24,12,29,.25)]"><DialogHeader className="border-b border-black/[.07] p-7 pr-16 sm:p-9"><div className="mb-2 flex items-center gap-2"><span className="rounded-full bg-[#ede5f1] px-3 py-1 text-[10px] font-black uppercase tracking-[.12em] text-[#683878]">Демо-режим</span><span className="flex items-center gap-1.5 text-[10px] font-semibold text-[#317c57]"><span className="sync-dot size-2 rounded-full bg-[#32a269]"/> Синхронизация работает</span></div><DialogTitle className="text-2xl font-black tracking-[-.045em] sm:text-3xl">Панель сотрудника</DialogTitle><DialogDescription className="max-w-[690px] leading-6">Покупатель не видит поставщиков. Здесь сотрудник понимает, где выкупать устройство, и управляет наценкой.</DialogDescription></DialogHeader><div className="p-7 sm:p-9"><div className="grid gap-4 lg:grid-cols-[1fr_250px]"><div className="rounded-[22px] border border-black/[.08] p-5"><div className="flex items-center gap-4"><div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-[#f2f2f4]"><Image src="/iphone-17-pro-max-blue.jpg" alt="" fill className="object-cover"/></div><div><p className="font-black">iPhone 17 Pro Max · 256 ГБ</p><p className="mt-1 text-[10px] uppercase tracking-[.11em] text-black/35">Deep Blue · 3 предложения</p></div></div><div className="mt-6 divide-y divide-black/[.07] border-y border-black/[.07]">{products[0].suppliers.map((supplier) => <div key={supplier.name} className="grid grid-cols-[1fr_auto] gap-4 py-4 text-sm"><div><p className="font-bold">{supplier.name}<span className={`ml-2 text-[10px] ${supplier.stock ? 'text-[#2f8158]' : 'text-[#9b752d]'}`}>{supplier.stock ? 'в наличии' : 'нет'}</span></p><p className="mt-1 text-[10px] text-black/30">{supplier.updated}</p></div><div className="text-right"><p className="font-black">{money(supplier.price)}</p>{supplier.price === 114990 && <p className="mt-1 text-[9px] font-bold text-[#6e3d7e]">ЛУЧШАЯ ЦЕНА</p>}</div></div>)}</div></div><div className="rounded-[22px] bg-[#2b1635] p-6 text-white"><p className="text-[10px] font-bold uppercase tracking-[.13em] text-white/40">Наценка</p><div className="mt-6 flex items-center justify-between rounded-2xl bg-white/[.07] p-2"><button onClick={() => setMarkup((value) => Math.max(0, value - 500))} className="grid size-9 place-items-center rounded-xl bg-white/[.07]"><Minus className="size-4"/></button><strong className="text-xl">{money(markup)}</strong><button onClick={() => setMarkup((value) => value + 500)} className="grid size-9 place-items-center rounded-xl bg-white/[.07]"><Plus className="size-4"/></button></div><div className="mt-6 space-y-3 text-xs"><div className="flex justify-between text-white/42"><span>Закупка</span><span>{money(114990)}</span></div><div className="flex justify-between border-t border-white/10 pt-3"><span>На сайте</span><strong>{money(114990 + markup)}</strong></div></div><p className="mt-6 text-[10px] leading-5 text-white/35">В рабочей версии наценка задаётся для категории, модели или отдельного товара.</p></div></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><Metric value="186" label="позиций собрано"/><Metric value="18" label="изменений за час"/><Metric value="3/3" label="источника онлайн"/></div></div></DialogContent></Dialog>
    </main>
  );
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { node.classList.add('is-visible'); observer.disconnect(); } }, { threshold: 0.12 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className="reveal" style={{ transitionDelay: `${delay}ms` }}>{children}</div>;
}

function MiniStat({ value, text }: { value: string; text: string }) { return <div className="px-3 py-6 sm:px-6"><p className="text-xl font-black tracking-[-.04em]">{value}</p><p className="mt-1 text-[10px] font-semibold leading-4 text-black/35">{text}</p></div>; }
function Category({ icon: Icon, title, meta, active = false, onClick }: { icon: LucideIcon; title: string; meta: string; active?: boolean; onClick?: () => void }) { return <button disabled={!active} onClick={onClick} className={`group flex min-h-[140px] flex-col justify-between rounded-[22px] border p-5 text-left transition ${active ? 'border-[#6c407b]/20 bg-[#2b1635] text-white shadow-[0_16px_40px_rgba(43,22,53,.13)] hover:-translate-y-1' : 'border-black/[.07] bg-[#f7f6f8] text-black/35'}`}><span className={`grid size-10 place-items-center rounded-xl ${active ? 'bg-white/10' : 'bg-white'}`}><Icon className="size-4"/></span><span><span className="flex items-center justify-between text-base font-black"><span>{title}</span>{active && <ChevronRight className="size-4 transition group-hover:translate-x-1"/>}</span><span className={`mt-1 block text-[10px] ${active ? 'text-white/42' : 'text-black/28'}`}>{meta}</span></span></button>; }
function Filter({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) { return <label className="flex h-12 min-w-[150px] items-center gap-2 rounded-[13px] bg-[#f5f3f6] px-4 text-xs"><span className="text-black/35">{label}:</span><select value={value} onChange={(event) => onChange(event.target.value)} className="flex-1 bg-transparent font-bold outline-none">{options.map((option) => <option key={option}>{option}</option>)}</select></label>; }
function ProductCard({ product, selected, onAdd }: { product: Product; selected: boolean; onAdd: () => void }) { return <article className="real-product-card group overflow-hidden rounded-[22px] border border-black/[.07] bg-white"><div className="relative h-[330px] overflow-hidden bg-[#f1f1f3]"><button className="absolute right-4 top-4 z-10 grid size-9 place-items-center rounded-full bg-white/86 text-black/36 shadow-sm backdrop-blur" aria-label="Добавить в избранное"><Heart className="size-4"/></button>{product.oldPrice && <span className="absolute left-4 top-4 z-10 rounded-full bg-[#2b1635] px-3 py-1.5 text-[9px] font-black uppercase tracking-[.09em] text-white">Выгодно</span>}<Image src={product.image} alt={`${product.name}, ${product.color}`} fill className={`${product.imageMode === 'cover' ? 'object-cover' : 'object-contain p-7'} transition duration-700 group-hover:scale-[1.04]`}/></div><div className="p-5"><div className="flex items-center justify-between gap-2"><span className={`text-[10px] font-bold ${product.stock === 'available' ? 'text-[#2f8259]' : 'text-[#96722d]'}`}>{product.stock === 'available' ? '● В наличии' : '○ Под заказ'}</span><span className="text-[9px] text-black/28">обновлено сейчас</span></div><h3 className="mt-3 text-xl font-black tracking-[-.035em]">{product.name}</h3><p className="mt-1.5 text-xs text-black/40">{product.memory} · {product.color}</p><div className="mt-6 flex items-end justify-between gap-3"><div>{product.oldPrice && <p className="text-[10px] text-black/30 line-through">{money(product.oldPrice)}</p>}<p className="text-xl font-black tracking-[-.035em]">{money(product.price)}</p></div><button onClick={onAdd} className="grid size-11 place-items-center rounded-full bg-[#2b1635] text-white transition hover:bg-[#704080]" aria-label={`Добавить ${product.name} в заявку`}>{selected ? <Check className="size-4"/> : <Plus className="size-4"/>}</button></div>{product.stock === 'order' && <p className="mt-3 rounded-xl bg-[#f6f0e5] px-3 py-2 text-[10px] font-semibold text-[#82672d]">Под заказ на 1 000 ₽ дешевле</p>}</div></article>; }
function Step({ number, title, text }: { number: string; title: string; text: string }) { return <article className="bg-white/[.045] p-7 sm:p-8"><span className="text-[10px] font-black tracking-[.14em] text-[#c29bd0]">{number}</span><h3 className="mt-12 text-xl font-black">{title}</h3><p className="mt-3 text-sm leading-6 text-white/42">{text}</p></article>; }
function ServiceChip({ icon: Icon, text }: { icon: LucideIcon; text: string }) { return <span className="inline-flex items-center gap-2 rounded-full border border-black/[.08] bg-[#f7f5f8] px-4 py-3 text-xs font-bold"><Icon className="size-4 text-[#704080]"/>{text}</span>; }
function Contact({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) { return <div className="flex items-center gap-3 rounded-2xl bg-white/[.07] p-4"><span className="grid size-10 place-items-center rounded-xl bg-white/[.08]"><Icon className="size-4"/></span><div><p className="text-[9px] font-semibold text-white/38">{label}</p><p className="mt-1 text-xs font-bold">{value}</p></div></div>; }
function CartRow({ product, onRemove }: { product: Product; onRemove: () => void }) { return <div className="flex items-center gap-3 rounded-2xl border border-black/[.07] p-3"><div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-[#f1f1f3]"><Image src={product.image} alt="" fill className={product.imageMode === 'cover' ? 'object-cover' : 'object-contain p-1'}/></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{product.name}</p><p className="mt-1 text-[10px] text-black/36">{product.memory} · {product.color}</p><p className="mt-2 text-sm font-black">{money(product.price)}</p></div><button type="button" onClick={onRemove} className="grid size-9 place-items-center text-black/30 hover:text-black" aria-label="Удалить"><X className="size-4"/></button></div>; }
function Choice({ active, onClick, icon: Icon, title, note }: { active: boolean; onClick: () => void; icon: LucideIcon; title: string; note: string }) { return <button type="button" onClick={onClick} className={`rounded-2xl border p-4 text-left transition ${active ? 'border-[#754686] bg-[#f0e7f3]' : 'border-black/[.08] bg-white'}`}><Icon className="size-4 text-[#704080]"/><p className="mt-4 text-xs font-black">{title}</p><p className="mt-1 text-[9px] text-black/36">{note}</p></button>; }
function Payment({ active, onClick, icon: Icon, title, note }: { active: boolean; onClick: () => void; icon: LucideIcon; title: string; note: string }) { return <button type="button" onClick={onClick} className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${active ? 'border-[#754686] bg-[#f0e7f3]' : 'border-black/[.08] bg-white'}`}><span className="grid size-9 place-items-center rounded-xl bg-white"><Icon className="size-4 text-[#704080]"/></span><span className="flex-1 text-xs font-black">{title}</span><span className="text-[9px] text-black/36">{note}</span>{active && <Check className="size-4 text-[#704080]"/>}</button>; }
function Metric({ value, label }: { value: string; label: string }) { return <div className="rounded-2xl bg-[#f5f3f6] p-4"><p className="text-xl font-black">{value}</p><p className="mt-1 text-[9px] text-black/35">{label}</p></div>; }
function Success({ onClose }: { onClose: () => void }) { return <div className="grid flex-1 place-items-center p-10 text-center"><div><span className="mx-auto grid size-16 place-items-center rounded-full bg-[#e5f4eb] text-[#2f8159]"><Check className="size-6"/></span><h3 className="mt-6 text-2xl font-black">Заявка принята</h3><p className="mx-auto mt-3 max-w-[340px] text-sm leading-6 text-black/44">Это демонстрация. В рабочей версии заявка поступит менеджеру Take Phone.</p><Button onClick={onClose} className="mt-6 rounded-full bg-[#2b1635] px-6 text-white">Вернуться к сайту</Button></div></div>; }
function EmptyCart({ onCatalog }: { onCatalog: () => void }) { return <div className="grid flex-1 place-items-center p-10 text-center"><div><ShoppingBag className="mx-auto size-7 text-black/25"/><h3 className="mt-5 text-xl font-black">В заявке пока пусто</h3><p className="mt-2 text-sm text-black/42">Добавьте устройство из каталога.</p><Button onClick={onCatalog} className="mt-6 rounded-full bg-[#2b1635] px-5 text-white">Открыть каталог</Button></div></div>; }
