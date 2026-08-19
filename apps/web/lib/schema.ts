import type { CheckIn, Habit } from '@streak-map/core';
import { z } from 'zod';

export const EXPORT_SCHEMA_VERSION = 1;

const dateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');
const isoTimestampSchema = z.iso.datetime();

const habitSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  color: z.string(),
  interval: z.enum(['daily', 'weekly']),
  target: z.number().int().min(1).max(20),
  startDate: dateKeySchema,
  order: z.number().int(),
  archivedAt: isoTimestampSchema.optional(),
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
  deletedAt: isoTimestampSchema.optional(),
}) satisfies z.ZodType<Habit>;

const checkInSchema = z.object({
  id: z.string(),
  habitId: z.string(),
  date: dateKeySchema,
  count: z.number().int().min(1),
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
  deletedAt: isoTimestampSchema.optional(),
}) satisfies z.ZodType<CheckIn>;

export const exportSchema = z.object({
  schemaVersion: z.literal(EXPORT_SCHEMA_VERSION),
  habits: z.array(habitSchema),
  checkins: z.array(checkInSchema),
});

export type ExportPayload = z.infer<typeof exportSchema>;

export function buildExportPayload(habits: Habit[], checkins: CheckIn[]): ExportPayload {
  return { schemaVersion: EXPORT_SCHEMA_VERSION, habits, checkins };
}

export function parseImportPayload(json: unknown): ExportPayload {
  return exportSchema.parse(json);
}
