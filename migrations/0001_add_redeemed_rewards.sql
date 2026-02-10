-- Migration: Add redeemed_rewards table for reward redemption tracking
-- This table tracks when children "buy" rewards with their XP

CREATE TABLE IF NOT EXISTS "redeemed_rewards" (
  "id" serial PRIMARY KEY,
  "reward_id" integer NOT NULL REFERENCES "rewards"("id"),
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "xp_spent" integer NOT NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "redeemed_at" timestamp DEFAULT now(),
  "approved_at" timestamp
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "redeemed_rewards_user_id_idx" ON "redeemed_rewards"("user_id");
CREATE INDEX IF NOT EXISTS "redeemed_rewards_status_idx" ON "redeemed_rewards"("status");
