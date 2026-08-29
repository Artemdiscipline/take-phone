import type { Metadata } from 'next';

import { StaffLoginForm } from '@/components/staff/login-form';
import { StaffPanel } from '@/components/staff/staff-panel';
import { getStaffAuthMode, hasStaffSession } from '@/lib/server/auth';
import { getStaffOverview } from '@/lib/server/catalog-service';
import { SOURCE_LABELS, SOURCE_URLS } from '@/lib/sources/registry';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Панель сотрудника',
  robots: { index: false, follow: false },
};

export default async function StaffPage() {
  const mode = getStaffAuthMode();

  // Прод без секретов не должен открывать панель «на всякий случай».
  if (mode === 'misconfigured') {
    return (
      <div className="shell">
        <StaffConfigError />
      </div>
    );
  }

  if (!await hasStaffSession()) {
    return (
      <div className="shell">
        <StaffLoginForm demoAccess={mode === 'demo'} />
      </div>
    );
  }

  const overview = await getStaffOverview();

  return (
    <div className="shell">
      <StaffPanel
        initialData={overview}
        sourceLabels={SOURCE_LABELS}
        sourceUrls={SOURCE_URLS}
        demoAccess={mode === 'demo'}
      />
    </div>
  );
}

function StaffConfigError() {
  return (
    <div className="mx-auto max-w-[520px] py-16 lg:py-24">
      <div className="rounded-2xl border border-order/30 bg-order-soft p-7 sm:p-8">
        <h1 className="text-lg font-semibold text-order">Панель не настроена</h1>
        <p className="mt-3 text-sm leading-relaxed text-order">
          Не заданы переменные окружения <code>STAFF_PASSWORD</code> и{' '}
          <code>STAFF_SESSION_SECRET</code>. Демонстрационный доступ в этом
          окружении запрещён, поэтому панель закрыта полностью.
        </p>
        <p className="mt-3 text-[13px] leading-relaxed text-order/80">
          Задайте обе переменные и перезапустите приложение. Для стенда, где
          демо-доступ допустим, установите <code>ALLOW_DEMO_STAFF_ACCESS=1</code>.
        </p>
      </div>
    </div>
  );
}
