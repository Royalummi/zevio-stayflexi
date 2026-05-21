/**
 * Booking feature gate — Coming Soon mode.
 *
 * Booking is currently disabled for the public. Only the email addresses
 * listed in BOOKING_WHITELIST can proceed to payment. Everyone else will
 * see a "Coming Soon" message instead of the Confirm & Pay button.
 *
 * To add more testers, append their email (lowercase) to the array below.
 * When you're ready to open bookings for everyone, set BOOKING_OPEN = true.
 */

export const BOOKING_OPEN = false;

export const BOOKING_WHITELIST: string[] = [
  "ranjith.gopafy@gmail.com",
  "mahendrasimha.rs@gmail.com",
  "mithunmanju77@gmail.com",
  "shashankmanjunath13@gmail.com",
  "testuser@zevio.in",
];

/**
 * Returns true if the given user email is allowed to book right now.
 * Always returns true when BOOKING_OPEN is true.
 */
export function canBook(email: string | null | undefined): boolean {
  if (BOOKING_OPEN) return true;
  if (!email) return false;
  return BOOKING_WHITELIST.includes(email.toLowerCase().trim());
}
