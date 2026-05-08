import { pgTable, serial, text, timestamp, boolean, varchar } from "drizzle-orm/pg-core";

export const tempEmails = pgTable("temp_emails", {
  id: serial("id").primaryKey(),
  address: varchar("address", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const emailMessages = pgTable("email_messages", {
  id: serial("id").primaryKey(),
  emailAddress: varchar("email_address", { length: 255 }).notNull(),
  sender: varchar("sender", { length: 255 }).notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  receivedAt: timestamp("received_at").defaultNow().notNull(),
  isRead: boolean("is_read").default(false).notNull(),
});

export const videoDownloads = pgTable("video_downloads", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  platform: varchar("platform", { length: 100 }).notNull(),
  format: varchar("format", { length: 50 }).notNull(),
  quality: varchar("quality", { length: 50 }).notNull(),
  title: text("title").notNull(),
  thumbnail: text("thumbnail"),
  downloadedAt: timestamp("downloaded_at").defaultNow().notNull(),
  status: varchar("status", { length: 50 }).default("completed").notNull(),
});
