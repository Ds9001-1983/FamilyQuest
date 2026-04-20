import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const families = pgTable("families", {
  id: serial("id").primaryKey(),
  familyName: text("family_name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  isSetupComplete: boolean("is_setup_complete").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isParent: boolean("is_parent").notNull().default(false),
  totalXP: integer("total_xp").notNull().default(0),
  // New family fields (optional)
  name: text("name"),
  age: integer("age"),
  familyId: integer("family_id").references(() => families.id),
  // bcrypt hash of a 4–6 digit PIN used for child login. Nullable; children
  // without a PIN cannot sign in.
  pinHash: text("pin_hash"),
  // Expo push token for delivering notifications to this user's device.
  pushToken: text("push_token"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const missions = pgTable("missions", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").notNull().references(() => families.id),
  title: text("title").notNull(),
  description: text("description"),
  xpReward: integer("xp_reward").notNull().default(10),
  assignedToUserId: integer("assigned_to_user_id").references(() => users.id),
  createdByUserId: integer("created_by_user_id").notNull().references(() => users.id),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  icon: text("icon").notNull().default("tasks"),
});

export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").notNull().references(() => families.id),
  name: text("name").notNull(),
  description: text("description"),
  requiredXP: integer("required_xp").notNull(),
  icon: text("icon").notNull().default("gift"),
  createdByUserId: integer("created_by_user_id").notNull().references(() => users.id),
});

export const insertFamilySchema = createInsertSchema(families).omit({
  id: true,
  isSetupComplete: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  totalXP: true,
  createdAt: true,
});

export const insertMissionSchema = createInsertSchema(missions).omit({
  id: true,
  completed: true,
  completedAt: true,
  familyId: true,
  createdByUserId: true,
});

export const insertRewardSchema = createInsertSchema(rewards).omit({
  id: true,
  familyId: true,
  createdByUserId: true,
});

export type InsertFamily = z.infer<typeof insertFamilySchema>;
export type Family = typeof families.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertMission = z.infer<typeof insertMissionSchema>;
export type Mission = typeof missions.$inferSelect;
export type InsertReward = z.infer<typeof insertRewardSchema>;
export type Reward = typeof rewards.$inferSelect;
