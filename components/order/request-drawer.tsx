'use client';

import Image from 'next/image';
import { useState } from 'react';
import {
  ArrowRight,
  Banknote,
  Check,
  CreditCard,
  Info,
  MessageCircle,
  ShoppingBag,
  Store,
  Truck,
  Wallet,
  X,
} from 'lucide-react';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { AppLink } from '@/components/site/app-link';
import { isStaticPreview } from '@/lib/build-mode';
import { colorRu } from '@/lib/catalog/normalize';
import { applyCardFee, cardFeeAmount } from '@/lib/catalog/pricing';
import { formatPrice } from '@/lib/format';
import { cardFeeLabel, site, terms } from '@/lib/site';
import { useRequest } from './request-store';

type Delivery = 'pickup' | 'delivery';
type Payment = 'transfer' | 'cash' | 'card';

/** Что показываем на экране успеха — приходит из ответа сервера. */
interface Submitted {
  publicNumber: string;
  total: number;
  delivery: Delivery;
  devices: string[];
  /** `preview` — статическая витрина, заявка никуда не ушла. */
  delivered: 'stored' | 'webhook' | 'telegram' | 'preview';
}

export function RequestDrawer() {
  const { items, remove, clear, isOpen, setOpen, subtotal } = useRequest();

  const [delivery, setDelivery] = useState<Delivery>('pickup');
  const [payment, setPayment] = useState<Payment>('transfer');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [comment, setComment] = useState('');
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState<Submitted | null>(null);

  const total = payment === 'card' ? applyCardFee(subtotal) : subtotal;

  const submit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Повторное нажатие не должно создавать вторую заявку.
    if (sending || submitted) return;

    if (!consent) {
      setErrors({ consent: 'Отметьте согласие на обработку персональных данных' });
      return;
    }

    // Статическая витрина: серверного маршрута нет, поэтому заявку показываем
    // как неотправленную, а не имитируем приём.
    if (isStaticPreview) {
      setSubmitted({
        publicNumber: '—',
        total,
        delivery,
        devices: items.map((item) => item.title),
        delivered: 'preview',
      });
      return;
    }

    setSending(true);
    setErrors({});

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          comment,
          delivery,
          payment,
          consent,
          items: items.map((item) => ({
            productKey: item.productKey,
            productSlug: item.productSlug,
            title: item.title,
            model: item.model,
            memory: item.memory,
            memoryLabel: item.memoryLabel,
            color: item.color,
            simType: item.simType,
            simLabel: item.simLabel,
            price: item.price,
            availability: item.availability,
            quantity: item.quantity,
          })),
        }),
      });

      const payload = await response.json() as {
        errors?: Record<string, string>;
        error?: string;
        publicNumber?: string;
        total?: number;
        delivery?: Delivery;
        delivered?: Submitted['delivered'];
      };

      if (!response.ok) {
        // Введённые данные сохраняем — человеку не придётся набирать заново.
        const nextErrors = payload.errors
          ?? { form: payload.error ?? 'Не удалось отправить заявку. Попробуйте ещё раз.' };
        setErrors(nextErrors);
        focusFirstError(nextErrors);
        return;
      }

      setSubmitted({
        publicNumber: payload.publicNumber ?? '—',
        total: payload.total ?? total,
        delivery: payload.delivery ?? delivery,
        devices: items.map((item) => item.title),
        delivered: payload.delivered ?? 'stored',
      });

      // Заявка принята: очищаем корзину и поля формы.
      clear();
      setName('');
      setPhone('');
      setComment('');
      setConsent(false);
    } catch {
      setErrors({
        form: 'Нет связи с сервером. Проверьте интернет или позвоните нам — оформим по телефону.',
      });
    } finally {
      setSending(false);
    }
  };

  const closeSuccess = () => {
    setSubmitted(null);
    setOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent className="flex w-full flex-col gap-0 border-line bg-paper p-0 text-ink sm:max-w-[520px]">
        <SheetHeader className="border-b border-line p-6">
          <SheetTitle className="text-xl font-semibold tracking-[-0.02em]">
            {submitted ? 'Заявка' : 'Заявка на устройство'}
          </SheetTitle>
          <SheetDescription>
            Менеджер подтвердит наличие и итоговую цену. Онлайн-оплата на сайте не требуется.
          </SheetDescription>
        </SheetHeader>

        {submitted
          ? <SuccessState submitted={submitted} onClose={closeSuccess} />
          : items.length === 0
            ? <EmptyState onClose={() => setOpen(false)} />
            : (
              <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 space-y-7 overflow-y-auto p-6">
                  <section className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.productKey}
                        className="flex items-center gap-3 rounded-xl border border-line p-2.5"
                      >
                        <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-surface">
                          <Image src={item.image} alt="" fill sizes="64px" className="object-contain p-1.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <AppLink
                            href={`/product/${item.productSlug}`}
                            onClick={() => setOpen(false)}
                            className="block text-sm font-medium leading-snug transition hover:text-accent"
                          >
                            {item.title}
                          </AppLink>
                          <p className="mt-0.5 text-[12px] text-ink-faint">
                            {item.memoryLabel} · {colorRu(item.color) ?? item.color} · {item.simLabel}
                          </p>
                          <p className="mt-1 text-sm font-semibold">{formatPrice(item.price)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(item.productKey)}
                          className="grid size-9 shrink-0 place-items-center rounded-lg text-ink-faint transition hover:bg-surface hover:text-ink"
                          aria-label={`Убрать ${item.title} из заявки`}
                        >
                          <X className="size-4" aria-hidden />
                        </button>
                      </div>
                    ))}
                  </section>

                  <section>
                    <p className="field-label">Как получить</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <OptionCard
                        active={delivery === 'pickup'}
                        onClick={() => setDelivery('pickup')}
                        icon={<Store className="size-4" aria-hidden />}
                        title="Самовывоз"
                        note={site.address}
                      />
                      <OptionCard
                        active={delivery === 'delivery'}
                        onClick={() => setDelivery('delivery')}
                        icon={<Truck className="size-4" aria-hidden />}
                        title="Доставка"
                        note="По Тюмени"
                      />
                    </div>
                    {delivery === 'pickup' && (
                      <p className="mt-2.5 flex gap-2 rounded-xl bg-surface p-3 text-[12px] leading-relaxed text-ink-soft">
                        <Info className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden />
                        Для бронирования устройства до вашего приезда может потребоваться
                        предоплата {formatPrice(terms.reservationPrepayment)}. Менеджер
                        согласует её при подтверждении заявки.
                      </p>
                    )}
                  </section>

                  <section>
                    <p className="field-label">Способ оплаты</p>
                    <div className="mt-3 space-y-2">
                      <PaymentRow
                        active={payment === 'transfer'}
                        onClick={() => setPayment('transfer')}
                        icon={<Wallet className="size-4" aria-hidden />}
                        title="Перевод при получении"
                        note="Без доплаты"
                      />
                      <PaymentRow
                        active={payment === 'cash'}
                        onClick={() => setPayment('cash')}
                        icon={<Banknote className="size-4" aria-hidden />}
                        title="Наличными"
                        note="В магазине"
                      />
                      <PaymentRow
                        active={payment === 'card'}
                        onClick={() => setPayment('card')}
                        icon={<CreditCard className="size-4" aria-hidden />}
                        title="Банковская карта"
                        note={`+${cardFeeLabel}`}
                      />
                    </div>
                  </section>

                  <section className="grid gap-4 sm:grid-cols-2">
                    <Field
                      id="request-name"
                      label="Ваше имя"
                      value={name}
                      onChange={setName}
                      error={errors.name}
                      placeholder="Артём"
                      autoComplete="name"
                    />
                    <Field
                      id="request-phone"
                      label="Телефон"
                      value={phone}
                      onChange={setPhone}
                      error={errors.phone}
                      placeholder="+7 999 000-00-00"
                      type="tel"
                      autoComplete="tel"
                    />
                    <div className="sm:col-span-2">
                      <label htmlFor="request-comment" className="field-label">Комментарий</label>
                      <textarea
                        id="request-comment"
                        value={comment}
                        onChange={(event) => setComment(event.target.value)}
                        rows={3}
                        placeholder="Удобное время, вопросы по trade-in, нужная комплектация"
                        className="mt-2 w-full resize-none rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm outline-none transition focus:border-accent"
                      />
                    </div>
                  </section>

                  <section>
                    <label
                      htmlFor="request-consent"
                      className="flex cursor-pointer gap-3 text-[13px] leading-relaxed text-ink-soft"
                    >
                      <input
                        id="request-consent"
                        type="checkbox"
                        checked={consent}
                        onChange={(event) => {
                          setConsent(event.target.checked);
                          if (event.target.checked) {
                            setErrors((current) => ({ ...current, consent: '' }));
                          }
                        }}
                        aria-invalid={errors.consent ? true : undefined}
                        className="mt-0.5 size-4 shrink-0 accent-[color:var(--accent)]"
                      />
                      <span>
                        Я согласен на обработку персональных данных.{' '}
                        <AppLink
                          href="/privacy"
                          onClick={() => setOpen(false)}
                          className="text-accent underline underline-offset-2"
                        >
                          Условия
                        </AppLink>
                      </span>
                    </label>
                    {errors.consent && (
                      <p className="mt-1.5 text-[12px] text-order">{errors.consent}</p>
                    )}
                  </section>

                  {errors.form && (
                    <p className="rounded-xl bg-order-soft p-3 text-[13px] text-order">{errors.form}</p>
                  )}
                </div>

                <div className="border-t border-line bg-surface p-6">
                  <div className="flex items-end justify-between gap-4">
                    <span className="text-sm text-ink-soft">Итого ориентировочно</span>
                    <strong className="text-2xl font-semibold tracking-[-0.03em]">
                      {formatPrice(total)}
                    </strong>
                  </div>

                  {payment === 'card' && (
                    <p className="mt-1.5 text-right text-[12px] text-ink-faint">
                      Включена комиссия {cardFeeLabel} — {formatPrice(cardFeeAmount(subtotal))}
                    </p>
                  )}

                  <p className="mt-3 text-[12px] leading-relaxed text-ink-faint">
                    Итоговую стоимость и наличие подтверждает менеджер. Оплата на сайте
                    не проводится.
                  </p>

                  <button
                    type="submit"
                    disabled={sending}
                    className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-plum text-sm font-medium text-white transition hover:bg-plum-soft disabled:opacity-60"
                  >
                    {sending ? 'Отправляем…' : 'Отправить заявку'}
                    {!sending && <ArrowRight className="size-4" aria-hidden />}
                  </button>
                </div>
              </form>
            )}
      </SheetContent>
    </Sheet>
  );
}

function focusFirstError(errors: Record<string, string>): void {
  const field = ['name', 'phone'].find((key) => errors[key]);
  if (!field) return;

  const input = document.getElementById(`request-${field}`);
  input?.scrollIntoView({ block: 'center' });
  input?.focus({ preventScroll: true });
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  placeholder,
  type = 'text',
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="field-label">{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`mt-2 h-11 w-full rounded-xl border bg-paper px-3.5 text-sm outline-none transition focus:border-accent ${
          error ? 'border-order' : 'border-line'
        }`}
      />
      {error && <p id={`${id}-error`} className="mt-1.5 text-[12px] text-order">{error}</p>}
    </div>
  );
}

function OptionCard({
  active,
  onClick,
  icon,
  title,
  note,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  note: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-xl border p-3.5 text-left transition ${
        active ? 'border-accent bg-accent-soft' : 'border-line hover:border-line-strong'
      }`}
    >
      <span className={active ? 'text-accent' : 'text-ink-faint'}>{icon}</span>
      <span className="mt-3 block text-sm font-medium">{title}</span>
      <span className="mt-0.5 block text-[12px] text-ink-faint">{note}</span>
    </button>
  );
}

function PaymentRow({
  active,
  onClick,
  icon,
  title,
  note,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  note: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
        active ? 'border-accent bg-accent-soft' : 'border-line hover:border-line-strong'
      }`}
    >
      <span className={`grid size-9 shrink-0 place-items-center rounded-lg bg-paper ${
        active ? 'text-accent' : 'text-ink-faint'
      }`}>
        {icon}
      </span>
      <span className="flex-1 text-sm font-medium">{title}</span>
      <span className="text-[12px] text-ink-faint">{note}</span>
      {active && <Check className="size-4 text-accent" aria-hidden />}
    </button>
  );
}

function EmptyState({ onClose }: { onClose: () => void }) {
  return (
    <div className="grid flex-1 place-items-center p-8 text-center">
      <div>
        <ShoppingBag className="mx-auto size-7 text-ink-faint" aria-hidden />
        <p className="mt-5 text-lg font-medium">В заявке пока пусто</p>
        <p className="mt-1.5 text-sm text-ink-soft">Выберите устройство в каталоге.</p>
        <AppLink
          href="/catalog"
          onClick={onClose}
          className="mt-6 inline-flex h-11 items-center rounded-xl bg-plum px-5 text-sm font-medium text-white transition hover:bg-plum-soft"
        >
          Открыть каталог
        </AppLink>
      </div>
    </div>
  );
}

function SuccessState({ submitted, onClose }: { submitted: Submitted; onClose: () => void }) {
  const preview = submitted.delivered === 'preview';

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-[400px] text-center">
        <span className={`mx-auto grid size-14 place-items-center rounded-full ${
          preview ? 'bg-order-soft text-order' : 'bg-stock-soft text-stock'
        }`}>
          {preview ? <Info className="size-6" aria-hidden /> : <Check className="size-6" aria-hidden />}
        </span>

        <h3 className="mt-6 text-xl font-semibold tracking-[-0.02em]">
          {preview ? 'Заявка не отправлена' : 'Ваша заявка принята'}
        </h3>

        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          {preview
            ? 'Это витрина-превью для ознакомления: она собрана как набор статических страниц, поэтому заявки отсюда не уходят.'
            : 'Менеджер Take Phone свяжется с вами для подтверждения наличия, итоговой цены и способа получения.'}
        </p>

        <dl className="mt-6 space-y-px overflow-hidden rounded-xl border border-line text-left text-sm">
          {!preview && (
            <SummaryRow term="Номер заявки" value={submitted.publicNumber} strong />
          )}
          <SummaryRow
            term={submitted.devices.length > 1 ? 'Устройства' : 'Устройство'}
            value={submitted.devices.join(', ')}
          />
          <SummaryRow term="Ориентировочно" value={formatPrice(submitted.total)} strong />
          <SummaryRow
            term="Получение"
            value={submitted.delivery === 'pickup' ? `Самовывоз, ${site.address}` : 'Доставка по Тюмени'}
          />
        </dl>

        {!preview && submitted.delivered === 'stored' && (
          <p className="mt-4 rounded-xl bg-surface p-3 text-[12px] leading-relaxed text-ink-soft">
            Заявка сохранена и уже доступна сотруднику в панели.
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <AppLink
            href="/catalog"
            onClick={onClose}
            className="flex h-11 items-center justify-center rounded-xl bg-plum text-sm font-medium text-white transition hover:bg-plum-soft"
          >
            Вернуться в каталог
          </AppLink>
          <a
            href={site.telegramManager}
            target="_blank"
            rel="noreferrer"
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-line text-sm font-medium transition hover:border-line-strong"
          >
            <MessageCircle className="size-4" aria-hidden />
            Написать менеджеру
          </a>
          <a
            href={site.phoneHref}
            className="flex h-11 items-center justify-center rounded-xl text-sm text-ink-soft transition hover:text-ink"
          >
            {site.phone}
          </a>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  term,
  value,
  strong = false,
}: {
  term: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 bg-paper px-4 py-3">
      <dt className="shrink-0 text-[13px] text-ink-faint">{term}</dt>
      <dd className={`text-right text-[13px] ${strong ? 'font-semibold' : ''}`}>{value}</dd>
    </div>
  );
}
