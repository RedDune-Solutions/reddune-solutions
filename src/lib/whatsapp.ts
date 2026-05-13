import { WHATSAPP_BASE } from "./constants";

/**
 * waLink — build a WhatsApp deep link with a pre-filled message. URL-encodes
 * the message so emoji, accents and line breaks survive the round trip.
 */
export function waLink(message: string): string {
  return `${WHATSAPP_BASE}?text=${encodeURIComponent(message)}`;
}
