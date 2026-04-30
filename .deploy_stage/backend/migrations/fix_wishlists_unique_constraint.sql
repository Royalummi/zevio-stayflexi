-- Migration: Fix wishlists UNIQUE constraint
-- Date: 2026-03-04
-- Root cause: UNIQUE KEY (user_id, property_id, deleted_at) allowed duplicate
--             active entries because MySQL treats NULL != NULL in UNIQUE constraints.
-- Fix: Drop the 3-column constraint, add clean 2-column constraint.

-- Step 1: Remove duplicate rows (keep oldest entry per user+property pair)
DELETE w1 FROM wishlists w1
INNER JOIN wishlists w2
  ON w1.user_id = w2.user_id
  AND w1.property_id = w2.property_id
  AND w1.created_at > w2.created_at;

-- Step 2: Drop broken constraint
ALTER TABLE wishlists DROP INDEX IF EXISTS unique_user_property;

-- Step 3: Add correct constraint (no deleted_at — removeFromWishlist uses hard DELETE)
ALTER TABLE wishlists ADD UNIQUE KEY unique_user_property (user_id, property_id);
