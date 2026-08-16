import { pgTable, serial, timestamp, text, varchar } from "drizzle-orm/pg-core"
import { index } from "drizzle-orm/pg-core"

export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const works = pgTable(
  "works",
  {
    id: serial().primaryKey().notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    link: varchar("link", { length: 500 }),
    image: varchar("image", { length: 500 }),
    sort_order: serial("sort_order").default(0).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("works_created_at_idx").on(table.created_at),
    index("works_sort_order_idx").on(table.sort_order),
  ]
);

export const site_config = pgTable(
  "site_config",
  {
    id: serial().primaryKey().notNull(),
    key: varchar("key", { length: 100 }).notNull().unique(),
    value: text("value").notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("config_key_idx").on(table.key),
  ]
);
