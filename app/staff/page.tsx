import type { Metadata } from 'next';

import { StaffLoginForm } from '@/components/staff/login-form';
import { StaffPanel } from '@/components/staff/staff-panel';
import { hasStaffSession, isStaffAuthConfigured } from '@/lib/server/auth';
import { getStaffOverview } from '@/lib/server/catalog-service';
import { SOURCE_LABELS } from '@/lib/sources/registry';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Панель сотрудника',
  robots: { index: false, follow: false },
};

export default async function StaffPage() {
  const demoAccess = !isStaffAuthConfigured();

  if (!await hasStaffSession()) {
    return (
      <div className="shell">
        <StaffLoginForm demoAccess={demoAccess} />
      </div>
    );
  }

  const overview = await getStaffOverview();

  return (
    <div className="shell">
      <StaffPanel
        initialData={overview}
        sourceLabels={SOURCE_LABELS}
        demoAccess={demoAccess}
      />
    </div>
  );
}
