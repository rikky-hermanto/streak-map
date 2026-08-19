'use client';

import dynamic from 'next/dynamic';
import { use } from 'react';

const HabitDetailClient = dynamic(
  () => import('@/components/habit/HabitDetailClient').then((m) => m.HabitDetailClient),
  { ssr: false },
);

export default function HabitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <HabitDetailClient habitId={id} />;
}
