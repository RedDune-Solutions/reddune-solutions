import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  EMAIL,
  FACEBOOK,
  INSTAGRAM,
  LINKEDIN,
  LOCATION,
  PHONE,
  PHONE_RAW,
} from "@/lib/constants";
import { waLink } from "@/lib/whatsapp";

/**
 * ContactInfo — Phase 5d sidebar shown next to the Contact form.
 *
 * Shows WhatsApp, email, social icon row (LinkedIn, Instagram, Facebook, WhatsApp)
 * and a Maps embed at the bottom.
 */

// ── Brand SVG icons (inline, no extra dependency) ───────────────────────────

function IconLinkedIn({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function IconInstagram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  );
}

function IconFacebook({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function IconWhatsApp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export function ContactInfo() {
  const t = useTranslations("HomePage.ContactSection.contactInfo");

  const SOCIALS = [
    {
      label: "LinkedIn",
      href: LINKEDIN,
      icon: <IconLinkedIn className="h-5 w-5" />,
    },
    {
      label: "Instagram",
      href: INSTAGRAM,
      icon: <IconInstagram className="h-5 w-5" />,
    },
    {
      label: "Facebook",
      href: FACEBOOK,
      icon: <IconFacebook className="h-5 w-5" />,
    },
    {
      label: "WhatsApp",
      href: waLink("Olá! Vim do site."),
      icon: <IconWhatsApp className="h-5 w-5" />,
    },
  ] as const;

  return (
    <aside
      className={cn(
        "flex flex-col gap-5",
        "rounded-card bg-sand-warm/70 backdrop-blur",
        "border border-dune-deep/10",
        "p-7 md:p-9",
      )}
    >
      <header>
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ember">
          {t("title")}
        </span>
      </header>

      <div className="flex flex-col gap-4">
        {/* WhatsApp */}
        <ContactRow
          label="WhatsApp"
          value={PHONE}
          href={waLink("Olá! Vim do site.")}
          external
        />

        {/* Email */}
        <ContactRow
          label={t("email")}
          value={EMAIL}
          href={`mailto:${EMAIL}`}
        />

        {/* Morada */}
        <ContactRow
          label={t("address")}
          value={`${LOCATION.city} · ${LOCATION.region}`}
          href={`https://www.google.com/maps?q=${encodeURIComponent(
            `${LOCATION.city}, ${LOCATION.region}, ${LOCATION.country}`,
          )}`}
          external
        />
      </div>

      {/* Redes sociais — ícones */}
      <div className="flex flex-col gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-mute">
          Redes sociais
        </span>
        <div className="flex items-center gap-3">
          {SOCIALS.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              title={s.label}
              className={cn(
                "inline-flex items-center justify-center",
                "h-10 w-10 rounded-full",
                "bg-cream border border-dune-deep/10 text-ink",
                "transition-all duration-200 hover:bg-ember hover:text-cream hover:border-ember hover:scale-105",
              )}
            >
              {s.icon}
            </a>
          ))}
        </div>
      </div>

      {/* Mapa */}
      <div
        className={cn(
          "relative overflow-hidden rounded-[20px]",
          "aspect-[4/3] mt-2",
        )}
        style={{
          background:
            "linear-gradient(160deg, #d6422a 0%, #5a0e0e 70%, #2a0805 100%)",
        }}
      >
        <iframe
          src={`https://www.google.com/maps?q=${encodeURIComponent(
            `${LOCATION.city}, ${LOCATION.region}, ${LOCATION.country}`,
          )}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={`Localização — ${LOCATION.city}, ${LOCATION.region}`}
          className="absolute inset-0 h-full w-full"
          style={{
            border: 0,
            filter: "contrast(1.05) saturate(0.85) sepia(0.18)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,107,63,0.18) 0%, transparent 35%, transparent 60%, rgba(42,8,5,0.45) 100%)",
          }}
        />
        <div className="absolute inset-x-5 bottom-4 text-cream">
          <div className="font-serif italic text-[20px] leading-tight">
            {LOCATION.city}
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] opacity-85">
            {LOCATION.lat.toFixed(4)}°N · {Math.abs(LOCATION.lng).toFixed(4)}°W
          </div>
        </div>
      </div>
    </aside>
  );
}

function ContactRow({
  label,
  value,
  href,
  external = false,
}: {
  label: string;
  value: string;
  href: string;
  external?: boolean;
}) {
  const linkClass = cn(
    "font-display text-[17px] md:text-[18px] font-semibold text-ink",
    "transition-colors duration-300 hover:text-ember",
  );
  if (external) {
    return (
      <div className="flex flex-col gap-1">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-mute">
          {label}
        </span>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          {value}
        </a>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-mute">
        {label}
      </span>
      <Link href={href} className={linkClass}>
        {value}
      </Link>
    </div>
  );
}
