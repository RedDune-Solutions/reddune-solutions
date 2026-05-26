/**
 * constants — site-wide static facts shared by Header, Footer, contact
 * pages and any WhatsApp deep links.
 *
 * Source of truth for phone, email, Instagram handle and the Fuseta location.
 * Prefer importing from here rather than hardcoding strings in components.
 *
 * Note: `src/config/contact.ts` reads the same values from env vars (so the
 * sender email can be overridden in production). Both modules can co-exist;
 * `constants.ts` is the convenient compile-time export for places where env
 * indirection adds no value (WhatsApp link, telephone display, Maps coords).
 */

export const PHONE = "+351 926 632 851";
export const PHONE_RAW = "351926632851";

export const EMAIL = "reddunesolutions@gmail.com";

export const WHATSAPP_BASE = `https://wa.me/${PHONE_RAW}`;

export const INSTAGRAM = "https://www.instagram.com/reddune_solutions/";
export const INSTAGRAM_HANDLE = "@reddune_solutions";

export const LINKEDIN = "https://www.linkedin.com/company/reddune-solutions/";
export const FACEBOOK = "https://www.facebook.com/profile.php?id=61590412977676";

export const LOCATION = {
  city: "Fuseta",
  region: "Algarve",
  country: "Portugal",
  lat: 37.0556,
  lng: -7.7445,
} as const;
