import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="shell grid min-h-[50vh] place-items-center py-20 text-center">
      <div>
        <p className="eyebrow">Страница не найдена</p>
        <h1 className="h2 mt-4">Такой страницы нет</h1>
        <p className="lede mx-auto mt-3 max-w-[420px]">
          Возможно, устройство больше не в каталоге или ссылка устарела.
        </p>
        <Link
          href="/catalog"
          className="mt-7 inline-flex h-12 items-center rounded-xl bg-plum px-6 text-sm font-medium text-white transition hover:bg-plum-soft"
        >
          Открыть каталог
        </Link>
      </div>
    </div>
  );
}
