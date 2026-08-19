'use client';

import dynamic from 'next/dynamic';

const DashboardClient = dynamic(
  () => import('@/components/dashboard/DashboardClient').then((m) => m.DashboardClient),
  { ssr: false },
);

export default function Page() {
  return <DashboardClient />;
}
