import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const auditLog = sqliteTable('audit_log', {
  id: text('id').primaryKey(),
  actorId: text('actor_id'),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
