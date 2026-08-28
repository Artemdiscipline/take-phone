'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  CreditCard,
  Heart,
  LockKeyhole,
  MapPin,
  Menu,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Smartphone,
  Store,
  Truck,
  UserRoundCog,
  WalletCards,
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
  tone: string;
  suppliers: Supplier[];
};

const products: Product[] = [
  { id: 1, name: 'iPhone 17 Pro Max', generation: '17', memory: '256 ГБ', color: 'Deep Violet', price: 119990, oldPrice: 126490, stock: 'available', tone: 'violet', suppliers: [
    { name: 'First Apple', price: 114990, stock: true, updated: '2 мин назад' },
    { name: 'IceApple', price: 116490, stock: true, updated: '4 мин назад' },
    { name: 'Phone24', price: 115990, stock: true, updated: '7 мин назад' },
  ] },
  { id: 2, name: 'iPhone 17 Pro', generation: '17', memory: '256 ГБ', color: 'Silver', price: 109990, oldPrice: 115490, stock: 'available', tone: 'silver', suppliers: [
    { name: 'First Apple', price: 104990, stock: true, updated: '2 мин назад' },
    { name: 'IceApple', price: 105490, stock: true, updated: '4 мин назад' },
    { name: 'Phone24', price: 106190, stock: false, updated: '6 мин назад' },
  ] },
  { id: 3, name: 'iPhone 17 Air', generation: '17', memory: '256 ГБ', color: 'Sky Blue', price: 94990, stock: 'available', tone: 'blue', suppliers: [
    { name: 'First Apple', price: 89990, stock: false, updated: '2 мин назад' },
    { name: 'IceApple', price: 89990, stock: true, updated: '3 мин назад' },
    { name: 'Phone24', price: 91490, stock: true, updated: '9 мин назад' },
  ] },
  { id: 4, name: 'iPhone 16 Pro Max', generation: '16', memory: '512 ГБ', color: 'Black Titanium', price: 124990, oldPrice: 131990, stock: 'available', tone: 'graphite', suppliers: [
    { name: 'First Apple', price: 119990, stock: true, updated: '1 мин назад' },
    { name: 'IceApple', price: 121490, stock: false, updated: '5 мин назад' },
    { name: 'Phone24', price: 120990, stock: true, updated: '8 мин назад' },
  ] },
  { id: 5, name: 'iPhone 16 Pro', generation: '16', memory: '128 ГБ', color: 'Natural Titanium', price: 88990, stock: 'available', tone: 'sand', suppliers: [
    { name: 'First Apple', price: 83990, stock: true, updated: '3 мин назад' },
    { name: 'IceApple', price: 84990, stock: true, updated: '6 мин назад' },
    { name: 'Phone24', price: 84290, stock: false, updated: '9 мин назад' },
  ] },
  { id: 6, name: 'iPhone 15 Pro Max', generation: '15', memory: '256 ГБ', color: 'White Titanium', price: 94990, oldPrice: 101990, stock: 'order', tone: 'rose', suppliers: [
    { name: 'First Apple', price: 89990, stock: true, updated: '3 мин назад' },
    { name: 'IceApple', price: 91490, stock: true, updated: '5 мин назад' },
    { name: 'Phone24', price: 90990, stock: true, updated: '8 мин назад' },
  ] },
];

const money = (value: number) => `${new Intl.NumberFormat('ru-RU').format(value)} ₽`;

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
  const [payment, setPayment] = useState<'transfer' | 'cash' | 'card'>('transfer');
  const [markup, setMarkup] = useState(5000);

  const filtered = useMemo(() => products.filter((product) => {
    const text = `${product.name} ${product.memory} ${product.color}`.toLowerCase();
    return text.includes(query.toLowerCase())
      && (generation === 'Все' || product.generation === generation)
      && (memory === 'Все' || product.memory.startsWith(memory))
      && (!onlyAvailable || product.stock === 'available');
  }), [query, generation, memory, onlyAvailable]);

  const cartProducts = products.filter((product) => cart.includes(product.id));
  const baseTotal = cartProducts.reduce((sum, product) => sum + product.price, 0);
  const total = payment === 'card' ? Math.round(baseTotal * 1.135) : baseTotal;
  const goCatalog = () => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
  const addProduct = (id: number) => { setCart((current) => current.includes(id) ? current : [...current, id]); setCartOpen(true); };

  return (
    <main className="min-h-screen bg-[#08060a] text-white">
      <section className="lux-hero relative isolate min-h-[900px] overflow-hidden">
        <Image src="/take-phone-luxury.png" alt="Премиальная коллекция смартфонов Take Phone" fill priority className="object-cover object-[58%_center]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,4,10,.97)_0%,rgba(7,4,10,.82)_37%,rgba(7,4,10,.1)_72%,rgba(7,4,10,.22)_100%)]" />
        <div className="absolute inset-x-0 top-0 z-30 border-b border-white/8 bg-black/20 px-6 py-2 text-center text-[9px] font-bold uppercase tracking-[.22em] text-white/45 backdrop-blur-lg">Tyumen · Цены обновлены 2 минуты назад · Открыто до 22:00</div>
        <header className="relative z-20 mt-[33px] border-b border-white/10">
          <div className="mx-auto flex h-[88px] max-w-[1480px] items-center px-6 lg:px-10">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-left leading-none" aria-label="Take Phone — наверх"><span className="block text-[21px] font-black tracking-[-.06em]">TAKE PHONE</span><span className="mt-2 block text-[9px] font-semibold tracking-[.34em] text-white/45">CURATED TECHNOLOGY</span></button>
            <nav className="mx-auto hidden gap-10 text-[10px] font-bold uppercase tracking-[.18em] text-white/58 lg:flex"><button onClick={goCatalog} className="hover:text-white">Каталог</button><a href="#method" className="hover:text-white">Как это работает</a><a href="#service" className="hover:text-white">Сервис</a><a href="#store" className="hover:text-white">Контакты</a></nav>
            <div className="ml-auto flex items-center gap-2"><button onClick={() => setStaffOpen(true)} className="hidden h-11 items-center gap-2 border border-white/12 px-4 text-[10px] font-bold uppercase tracking-[.14em] text-white/65 hover:bg-white/[.06] sm:inline-flex"><UserRoundCog className="size-4" /> Сотрудникам</button><button onClick={() => setCartOpen(true)} className="relative inline-flex h-11 items-center gap-2 bg-white px-5 text-[10px] font-black uppercase tracking-[.12em] text-[#120b17]"><ShoppingBag className="size-4" /> Заявка{cart.length > 0 && <span className="grid size-5 place-items-center bg-[#7d4c94] text-[9px] text-white">{cart.length}</span>}</button><button onClick={() => setMobileOpen(true)} className="grid size-11 place-items-center border border-white/12 lg:hidden"><Menu className="size-4" /></button></div>
          </div>
        </header>

        <div className="relative z-10 mx-auto flex min-h-[778px] max-w-[1480px] items-center px-6 pb-24 pt-12 lg:px-10">
          <div className="max-w-[760px]">
            <p className="lux-kicker">Кураторский каталог техники</p>
            <h1 className="mt-8 text-[clamp(58px,8.2vw,130px)] font-black leading-[.82] tracking-[-.085em]">ТЕХНИКА.<br/><span className="text-[#b991d2]">БЕЗ ЛИШНЕГО.</span></h1>
            <p className="mt-10 max-w-[520px] text-base leading-7 text-white/58 sm:text-lg">Один каталог вместо десятков вкладок. Система находит лучшее доступное предложение — вы получаете понятную цену и забираете устройство в Take Phone.</p>
            <div className="mt-11 flex flex-wrap items-center gap-6"><button onClick={goCatalog} className="inline-flex h-14 items-center gap-10 bg-white px-7 text-[10px] font-black uppercase tracking-[.15em] text-[#100a14] transition hover:bg-[#d9c3e5]">Открыть каталог <ArrowDown className="size-4" /></button><a href="https://t.me/take_phone72" target="_blank" rel="noreferrer" className="group inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.15em] text-white/66 hover:text-white">Консультация менеджера <ArrowUpRight className="size-4 transition group-hover:-translate-y-1 group-hover:translate-x-1" /></a></div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-black/24 backdrop-blur-xl"><div className="mx-auto grid max-w-[1480px] grid-cols-2 divide-x divide-white/10 px-6 lg:grid-cols-4 lg:px-10"><Stat value="186" label="позиций собрано"/><Stat value="3" label="партнёрских склада"/><Stat value="2 мин" label="с последнего обновления"/><Stat value="5 лет" label="гарантии"/></div></div>
      </section>

      <section id="catalog" className="bg-[#f1eff1] px-6 py-24 text-[#171219] lg:px-10 lg:py-32">
        <div className="mx-auto max-w-[1480px]">
          <div className="flex flex-col gap-8 border-b border-black/12 pb-10 lg:flex-row lg:items-end lg:justify-between">
            <div><p className="lux-kicker !text-[#72537f]">Каталог / Тюмень</p><h2 className="mt-5 text-[clamp(54px,7vw,100px)] font-black leading-[.85] tracking-[-.08em]">В НАЛИЧИИ</h2></div>
            <p className="max-w-[420px] text-sm leading-6 text-black/48">Одинаковые товары из трёх источников объединяются в одну карточку. Цена и статус пересчитываются автоматически.</p>
          </div>

          <div className="flex gap-8 overflow-x-auto border-b border-black/10 py-7 text-[10px] font-black uppercase tracking-[.17em] text-black/32">
            <button className="whitespace-nowrap text-[#6e3f83]">iPhone <span className="ml-2 text-[8px]">06</span></button><button disabled className="whitespace-nowrap">Mac <span className="ml-2 text-[8px]">soon</span></button><button disabled className="whitespace-nowrap">Apple Watch <span className="ml-2 text-[8px]">soon</span></button><button disabled className="whitespace-nowrap">AirPods <span className="ml-2 text-[8px]">soon</span></button>
          </div>

          <div className="grid gap-px border-b border-black/10 bg-black/10 lg:grid-cols-[1fr_auto_auto_auto]">
            <label className="flex h-16 items-center gap-3 bg-[#f7f5f7] px-5"><Search className="size-4 text-black/35" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm outline-none placeholder:text-black/32" placeholder="Поиск по модели, памяти или цвету" />{query && <button onClick={() => setQuery('')} aria-label="Очистить поиск"><X className="size-4 text-black/35" /></button>}</label>
            <FilterSelect value={generation} onChange={setGeneration} label="Модель" options={['Все','17','16','15']} />
            <FilterSelect value={memory} onChange={setMemory} label="Память" options={['Все','128','256','512']} />
            <button onClick={() => setOnlyAvailable((value) => !value)} className={`h-16 bg-[#f7f5f7] px-6 text-[10px] font-black uppercase tracking-[.14em] ${onlyAvailable ? 'text-[#6e3f83]' : 'text-black/42'}`}>{onlyAvailable ? '✓ Только в наличии' : 'Показать наличие'}</button>
          </div>

          <div className="mt-10 grid gap-px bg-black/10 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((product, index) => <ProductCard key={product.id} product={product} featured={index === 0 && filtered.length > 2} selected={cart.includes(product.id)} onAdd={() => addProduct(product.id)} />)}
          </div>
          {filtered.length === 0 && <div className="border-x border-b border-black/10 bg-[#f7f5f7] py-24 text-center"><Search className="mx-auto size-6 text-black/25"/><p className="mt-5 text-xl font-black tracking-[-.04em]">Ничего не найдено</p><button onClick={() => { setQuery(''); setGeneration('Все'); setMemory('Все'); setOnlyAvailable(false); }} className="mt-4 text-[10px] font-black uppercase tracking-[.14em] text-[#6e3f83]">Сбросить фильтры</button></div>}
        </div>
      </section>

      <section id="method" className="border-y border-white/8 bg-[#0c0810] px-6 py-24 lg:px-10 lg:py-32">
        <div className="mx-auto max-w-[1480px]">
          <div className="grid gap-14 lg:grid-cols-[.8fr_1.2fr]"><div><p className="lux-kicker">Невидимая технология</p><h2 className="mt-6 text-[clamp(48px,6vw,88px)] font-black leading-[.9] tracking-[-.075em]">ТРИ ИСТОЧНИКА.<br/><span className="text-white/26">ОДИН TAKE PHONE.</span></h2></div><p className="max-w-[620px] self-end text-lg leading-8 text-white/50">Покупателю не важно, где физически лежит устройство. Ему важны цена, наличие и уверенность в покупке. Вся сложная логика остаётся внутри системы.</p></div>
          <div className="mt-20 grid border-l border-t border-white/10 md:grid-cols-3">
            <Method number="01" title="Собираем" text="Система проверяет ассортимент трёх партнёрских магазинов." />
            <Method number="02" title="Сравниваем" text="Находит минимальную доступную цену и применяет вашу наценку." />
            <Method number="03" title="Объединяем" text="Показывает покупателю одну чистую карточку без дублей." />
          </div>
          <button onClick={() => setStaffOpen(true)} className="mt-12 inline-flex items-center gap-4 border-b border-[#b991d2] pb-2 text-[10px] font-black uppercase tracking-[.16em] text-[#c9a8da]">Открыть панель сотрудника <ArrowUpRight className="size-4" /></button>
        </div>
      </section>

      <section id="service" className="bg-[#e7e2e7] px-6 py-24 text-[#171219] lg:px-10 lg:py-32">
        <div className="mx-auto grid max-w-[1480px] gap-14 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
          <div><p className="lux-kicker !text-[#72537f]">После покупки</p><p className="mt-6 text-[clamp(150px,24vw,360px)] font-black leading-[.7] tracking-[-.12em] text-[#24152c]">5</p><p className="mt-10 text-[clamp(42px,5vw,76px)] font-black leading-[.9] tracking-[-.07em]">ЛЕТ ГАРАНТИИ</p></div>
          <div className="border-t border-black/15 pt-8"><p className="max-w-[560px] text-xl leading-8 text-black/58">Не громкое обещание, а собственный сервис в магазине. Диагностика, ремонт и поддержка — в одном месте.</p><div className="mt-12 divide-y divide-black/12 border-y border-black/12"><ServiceLine title="Собственный сервис" text="Мастера и оборудование в Take Phone"/><ServiceLine title="Trade-in" text="Оцениваем технику любых брендов"/><ServiceLine title="Поддержка" text="Помогаем после покупки, а не только до неё"/></div></div>
        </div>
      </section>

      <section id="store" className="relative overflow-hidden bg-[#151019] px-6 py-24 lg:px-10 lg:py-32">
        <div className="absolute -right-[12%] top-1/2 size-[620px] -translate-y-1/2 rounded-full bg-[#4f2e5f]/22 blur-[120px]" />
        <div className="relative mx-auto max-w-[1480px]">
          <div className="grid gap-16 lg:grid-cols-[1fr_.8fr]"><div><p className="lux-kicker">Take Phone / Tyumen</p><h2 className="mt-6 text-[clamp(56px,8vw,118px)] font-black leading-[.82] tracking-[-.08em]">ГЕРЦЕНА,<br/><span className="text-[#b991d2]">84К2.</span></h2><div className="mt-12 flex flex-wrap gap-4"><a href="https://t.me/take_phone72" target="_blank" rel="noreferrer" className="inline-flex h-14 items-center gap-8 bg-white px-7 text-[10px] font-black uppercase tracking-[.15em] text-black">Написать менеджеру <ArrowUpRight className="size-4" /></a><a href="tel:+73452499700" className="inline-flex h-14 items-center border border-white/14 px-7 text-[10px] font-black uppercase tracking-[.15em] text-white/75">+7 (3452) 499-700</a></div></div>
            <div className="grid content-end gap-px bg-white/10"><ContactLine label="Адрес" value="Тюмень, Герцена, 84к2" icon={MapPin}/><ContactLine label="Режим работы" value="Ежедневно, 09:00—22:00" icon={Store}/><ContactLine label="Формат" value="Самовывоз и доставка по городу" icon={Truck}/></div>
          </div>
          <footer className="mt-24 flex flex-col gap-5 border-t border-white/10 pt-8 text-[9px] font-bold uppercase tracking-[.16em] text-white/32 sm:flex-row sm:items-center sm:justify-between"><span>Take Phone · Demo concept · 2026</span><div className="flex gap-6"><a href="https://t.me/Takephone72" target="_blank" rel="noreferrer">Telegram</a><a href="https://vk.com/takephone72" target="_blank" rel="noreferrer">VKontakte</a><button onClick={() => setStaffOpen(true)}>Сотрудникам</button></div></footer>
        </div>
      </section>

      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent className="w-full overflow-y-auto border-l border-black/10 bg-[#f5f3f5] p-0 text-[#171219] sm:max-w-[540px]">
          <SheetHeader className="border-b border-black/10 p-7"><SheetTitle className="text-3xl font-black tracking-[-.06em]">ЗАЯВКА</SheetTitle><SheetDescription>Оплата на сайте не требуется. Менеджер подтвердит цену и наличие.</SheetDescription></SheetHeader>
          {orderSent ? <div className="grid flex-1 place-items-center p-10 text-center"><div><span className="mx-auto grid size-16 place-items-center bg-[#22142a] text-white"><Check className="size-6" /></span><h3 className="mt-7 text-3xl font-black tracking-[-.06em]">Заявка принята</h3><p className="mx-auto mt-4 max-w-[340px] text-sm leading-6 text-black/48">В демоверсии заявка не отправляется. В рабочем сайте она придёт менеджеру Take Phone.</p><Button onClick={() => { setOrderSent(false); setCartOpen(false); }} className="mt-7 h-12 bg-[#22142a] px-6 text-white">Вернуться к сайту</Button></div></div>
          : cartProducts.length === 0 ? <div className="grid flex-1 place-items-center p-10 text-center"><div><ShoppingBag className="mx-auto size-7 text-black/25"/><h3 className="mt-5 text-xl font-black">Пока пусто</h3><p className="mt-2 text-sm text-black/42">Выберите устройство в каталоге.</p><Button onClick={() => { setCartOpen(false); goCatalog(); }} className="mt-6 bg-[#22142a] px-5 text-white">Открыть каталог</Button></div></div>
          : <form onSubmit={(event) => { event.preventDefault(); setOrderSent(true); }} className="flex flex-1 flex-col"><div className="space-y-7 p-7"><div className="divide-y divide-black/10 border-y border-black/10">{cartProducts.map((product) => <CartRow key={product.id} product={product} onRemove={() => setCart((current) => current.filter((id) => id !== product.id))}/>)}</div><div><p className="field-label">Получение</p><div className="mt-3 grid grid-cols-2 gap-px bg-black/10"><Choice active={delivery === 'pickup'} onClick={() => setDelivery('pickup')} icon={Store} title="Самовывоз" note="Герцена, 84к2"/><Choice active={delivery === 'delivery'} onClick={() => setDelivery('delivery')} icon={Truck} title="Доставка" note="По Тюмени"/></div></div><div><p className="field-label">Оплата</p><div className="mt-3 divide-y divide-black/10 border-y border-black/10"><Payment active={payment === 'transfer'} onClick={() => setPayment('transfer')} icon={WalletCards} title="Перевод" note="Без доплаты"/><Payment active={payment === 'cash'} onClick={() => setPayment('cash')} icon={Store} title="Наличными" note="В магазине"/><Payment active={payment === 'card'} onClick={() => setPayment('card')} icon={CreditCard} title="Картой" note="+13,5%"/></div></div><div className="grid gap-4 sm:grid-cols-2"><label htmlFor="lux-name"><span className="field-label">Имя</span><Input id="lux-name" required placeholder="Артём" className="mt-2 h-12 rounded-none border-black/14 bg-white"/></label><label htmlFor="lux-phone"><span className="field-label">Телефон</span><Input id="lux-phone" required type="tel" placeholder="+7 999 000-00-00" className="mt-2 h-12 rounded-none border-black/14 bg-white"/></label></div></div><div className="mt-auto border-t border-black/10 bg-white p-7"><div className="flex items-end justify-between"><span className="text-[10px] font-bold uppercase tracking-[.14em] text-black/40">Итого</span><strong className="text-3xl tracking-[-.06em]">{money(total)}</strong></div>{payment === 'card' && <p className="mt-2 text-right text-[10px] text-[#764887]">Включена комиссия 13,5%</p>}<Button type="submit" className="mt-5 h-14 w-full rounded-none bg-[#22142a] text-[10px] font-black uppercase tracking-[.15em] text-white">Отправить заявку <ArrowRight/></Button></div></form>}
        </SheetContent>
      </Sheet>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[88%] border-r border-white/10 bg-[#0d0910] p-0 text-white sm:max-w-[380px]"><SheetHeader className="border-b border-white/10 p-7"><SheetTitle className="text-2xl font-black tracking-[-.05em] text-white">TAKE PHONE</SheetTitle><SheetDescription className="text-white/40">Curated technology · Tyumen</SheetDescription></SheetHeader><nav className="grid divide-y divide-white/10 border-b border-white/10 text-[11px] font-black uppercase tracking-[.15em]"><button onClick={() => { setMobileOpen(false); goCatalog(); }} className="flex h-16 items-center justify-between px-7">Каталог <ChevronRight/></button><a href="#method" onClick={() => setMobileOpen(false)} className="flex h-16 items-center justify-between px-7">Как это работает <ChevronRight/></a><a href="#service" onClick={() => setMobileOpen(false)} className="flex h-16 items-center justify-between px-7">Сервис <ChevronRight/></a><a href="#store" onClick={() => setMobileOpen(false)} className="flex h-16 items-center justify-between px-7">Контакты <ChevronRight/></a><button onClick={() => { setMobileOpen(false); setStaffOpen(true); }} className="flex h-16 items-center justify-between px-7">Сотрудникам <LockKeyhole/></button></nav></SheetContent>
      </Sheet>

      <Dialog open={staffOpen} onOpenChange={setStaffOpen}>
        <DialogContent className="max-h-[90vh] max-w-[980px] overflow-y-auto rounded-none border border-white/10 bg-[#0e0a11] p-0 text-white shadow-[0_40px_120px_rgba(0,0,0,.55)]"><DialogHeader className="border-b border-white/10 p-7 pr-16 sm:p-9"><p className="lux-kicker !text-[#bd95cf]">Internal / Demo</p><DialogTitle className="mt-3 text-3xl font-black tracking-[-.06em] text-white sm:text-4xl">ПАНЕЛЬ СОТРУДНИКА</DialogTitle><DialogDescription className="max-w-[690px] leading-6 text-white/42">Покупатель не видит источники. Сотрудник сразу понимает, где находится устройство и по какой цене его выкупать.</DialogDescription></DialogHeader><div className="p-7 sm:p-9"><div className="grid gap-px bg-white/10 lg:grid-cols-[1fr_260px]"><div className="bg-[#151018] p-5 sm:p-7"><div className="flex items-center gap-4"><span className="grid size-12 place-items-center bg-white/[.06]"><Smartphone className="size-5 text-[#c19ad2]"/></span><div><p className="font-black">iPhone 17 Pro Max · 256 ГБ</p><p className="mt-1 text-[10px] uppercase tracking-[.12em] text-white/34">Объединено 3 предложения</p></div></div><div className="mt-7 divide-y divide-white/10 border-y border-white/10">{products[0].suppliers.map((supplier) => <div key={supplier.name} className="grid grid-cols-[1fr_auto] gap-4 py-4 text-sm"><div><p className="font-bold">{supplier.name} <span className={`ml-2 text-[10px] ${supplier.stock ? 'text-[#86c8a5]' : 'text-[#cfaf71]'}`}>{supplier.stock ? 'в наличии' : 'нет'}</span></p><p className="mt-1 text-[10px] text-white/28">{supplier.updated}</p></div><div className="text-right"><p className="font-black">{money(supplier.price)}</p>{supplier.price === 114990 && <p className="mt-1 text-[8px] font-black uppercase tracking-[.12em] text-[#c19ad2]">Лучший вариант</p>}</div></div>)}</div></div><div className="bg-[#22142a] p-6"><p className="text-[9px] font-black uppercase tracking-[.16em] text-white/38">Наценка</p><div className="mt-7 flex items-center justify-between border-y border-white/12 py-4"><button onClick={() => setMarkup((value) => Math.max(0, value - 500))} className="grid size-9 place-items-center border border-white/12"><Minus className="size-4"/></button><strong className="text-xl">{money(markup)}</strong><button onClick={() => setMarkup((value) => value + 500)} className="grid size-9 place-items-center border border-white/12"><Plus className="size-4"/></button></div><div className="mt-7 space-y-4 text-xs"><div className="flex justify-between text-white/42"><span>Закупка</span><span>{money(114990)}</span></div><div className="flex justify-between border-t border-white/10 pt-4"><span>На сайте</span><strong>{money(114990 + markup)}</strong></div></div><p className="mt-8 text-[10px] leading-5 text-white/35">В рабочей версии наценка задаётся для категории, модели или отдельной позиции.</p></div></div><div className="mt-px grid gap-px bg-white/10 sm:grid-cols-3"><Metric value="186" label="позиций"/><Metric value="18" label="изменений за час"/><Metric value="3/3" label="источника онлайн"/></div></div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) { return <div className="px-4 py-5 first:pl-0 last:pr-0 lg:px-7"><p className="text-lg font-black tracking-[-.04em]">{value}</p><p className="mt-1 text-[9px] font-bold uppercase tracking-[.14em] text-white/34">{label}</p></div>; }

function FilterSelect({ value, onChange, label, options }: { value: string; onChange: (value: string) => void; label: string; options: string[] }) { return <label className="flex h-16 min-w-[165px] items-center gap-2 bg-[#f7f5f7] px-5 text-xs"><span className="text-black/34">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="flex-1 bg-transparent font-black outline-none">{options.map((option) => <option key={option}>{option}</option>)}</select></label>; }

function ProductCard({ product, featured, selected, onAdd }: { product: Product; featured: boolean; selected: boolean; onAdd: () => void }) {
  return <article className={`product-tile group relative flex flex-col overflow-hidden ${featured ? 'bg-[#171019] text-white md:col-span-2 xl:row-span-2' : 'bg-[#f7f5f7] text-[#171219]'}`}><div className={`relative ${featured ? 'min-h-[620px] xl:min-h-[760px]' : 'min-h-[410px]'} product-stage product-stage-${product.tone}`}><button className={`absolute right-5 top-5 z-20 grid size-10 place-items-center border ${featured ? 'border-white/12 bg-black/20 text-white/55' : 'border-black/10 bg-white/40 text-black/40'} backdrop-blur`} aria-label="Добавить в избранное"><Heart className="size-4"/></button>{product.oldPrice && <span className={`absolute left-5 top-5 z-20 text-[9px] font-black uppercase tracking-[.16em] ${featured ? 'text-[#c9a8d9]' : 'text-[#704183]'}`}>Selected price</span>}<Image src="/take-phone-product.png" alt={`${product.name}, ${product.color}`} fill className={`object-contain transition duration-700 group-hover:scale-[1.035] ${featured ? 'p-[6%]' : 'p-[8%]'}`} /></div><div className={`relative z-10 mt-auto border-t p-6 ${featured ? 'border-white/10 bg-[#171019]' : 'border-black/10 bg-[#f7f5f7]'}`}><div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[.14em]"><span className={product.stock === 'available' ? (featured ? 'text-[#a9d8bc]' : 'text-[#397956]') : 'text-[#9c7836]'}>{product.stock === 'available' ? '● В наличии' : '○ Под заказ'}</span><span className={featured ? 'text-white/30' : 'text-black/28'}>обновлено сейчас</span></div><h3 className={`${featured ? 'mt-6 text-4xl sm:text-5xl' : 'mt-4 text-2xl'} font-black leading-none tracking-[-.06em]`}>{product.name}</h3><p className={`mt-3 text-xs ${featured ? 'text-white/42' : 'text-black/42'}`}>{product.memory} · {product.color}</p><div className="mt-7 flex items-end justify-between gap-4"><div>{product.oldPrice && <p className={`text-[10px] line-through ${featured ? 'text-white/28' : 'text-black/28'}`}>{money(product.oldPrice)}</p>}<p className={`${featured ? 'text-3xl' : 'text-xl'} font-black tracking-[-.05em]`}>{money(product.price)}</p></div><button onClick={onAdd} className={`grid size-12 place-items-center ${featured ? 'bg-white text-black' : 'bg-[#22142a] text-white'}`} aria-label={`Добавить ${product.name} в заявку`}>{selected ? <Check className="size-4"/> : <ArrowUpRight className="size-4"/>}</button></div>{product.stock === 'order' && <p className="mt-4 text-[9px] font-bold uppercase tracking-[.12em] text-[#8c6630]">Под заказ на 1 000 ₽ дешевле</p>}</div></article>;
}

function Method({ number, title, text }: { number: string; title: string; text: string }) { return <article className="border-b border-r border-white/10 p-7 sm:p-9"><p className="text-[9px] font-black tracking-[.18em] text-[#aa7fbe]">{number}</p><h3 className="mt-16 text-2xl font-black tracking-[-.05em]">{title}</h3><p className="mt-4 max-w-[300px] text-sm leading-6 text-white/42">{text}</p></article>; }

function ServiceLine({ title, text }: { title: string; text: string }) { return <div className="grid gap-2 py-6 sm:grid-cols-[180px_1fr]"><p className="text-xs font-black uppercase tracking-[.12em]">{title}</p><p className="text-sm text-black/44">{text}</p></div>; }

function ContactLine({ label, value, icon: Icon }: { label: string; value: string; icon: typeof MapPin }) { return <div className="flex items-center gap-5 bg-[#1d1621] p-6"><span className="grid size-11 place-items-center border border-white/10"><Icon className="size-4 text-[#be97cf]"/></span><div><p className="text-[9px] font-black uppercase tracking-[.14em] text-white/30">{label}</p><p className="mt-2 text-sm font-bold text-white/75">{value}</p></div></div>; }

function CartRow({ product, onRemove }: { product: Product; onRemove: () => void }) { return <div className="flex items-center gap-4 py-4"><div className={`product-stage-${product.tone} relative size-20 shrink-0`}><Image src="/take-phone-product.png" alt="" fill className="object-contain p-1"/></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{product.name}</p><p className="mt-1 text-[10px] text-black/36">{product.memory} · {product.color}</p><p className="mt-2 text-sm font-black">{money(product.price)}</p></div><button type="button" onClick={onRemove} aria-label="Удалить" className="grid size-9 place-items-center text-black/30 hover:text-black"><X className="size-4"/></button></div>; }

function Choice({ active, onClick, icon: Icon, title, note }: { active: boolean; onClick: () => void; icon: typeof Store; title: string; note: string }) { return <button type="button" onClick={onClick} className={`p-4 text-left ${active ? 'bg-[#e6d9eb]' : 'bg-white'}`}><Icon className="size-4 text-[#6f4380]"/><p className="mt-5 text-xs font-black">{title}</p><p className="mt-1 text-[9px] text-black/36">{note}</p></button>; }

function Payment({ active, onClick, icon: Icon, title, note }: { active: boolean; onClick: () => void; icon: typeof CreditCard; title: string; note: string }) { return <button type="button" onClick={onClick} className="flex w-full items-center gap-4 py-4 text-left"><span className={`grid size-9 place-items-center ${active ? 'bg-[#22142a] text-white' : 'bg-white text-black/40'}`}><Icon className="size-4"/></span><span className="flex-1 text-xs font-black">{title}</span><span className="text-[9px] text-black/36">{note}</span>{active && <Check className="size-4 text-[#6f4380]"/>}</button>; }

function Metric({ value, label }: { value: string; label: string }) { return <div className="bg-[#151018] p-5"><p className="text-2xl font-black tracking-[-.05em]">{value}</p><p className="mt-1 text-[9px] font-bold uppercase tracking-[.13em] text-white/30">{label}</p></div>; }
