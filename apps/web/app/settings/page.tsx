'use client';

import dynamic from 'next/dynamic';

const SettingsClient = dynamic(
  () => import('@/components/settings/SettingsClient').then((m) => m.SettingsClient),
  { ssr: false },
);

export default function SettingsPage() {
  return <SettingsClient />;
}
