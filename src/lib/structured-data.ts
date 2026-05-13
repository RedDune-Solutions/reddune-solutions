/**
 * structured-data — builders for JSON-LD schemas.
 *
 * Type-safe helpers used by pages to produce schema.org payloads that are
 * inlined inside `<script type="application/ld+json">` tags. Centralising
 * here keeps URL/locale logic consistent and avoids per-page duplication.
 */

import { contactInfo } from "@/config/contact";
import { publicEnv } from "@/lib/env";
import { LOCATION } from "@/lib/constants";

type JsonLd = Record<string, unknown>;

const base = () => publicEnv.baseUrl;

/**
 * LocalBusiness — homepage. Includes geo coordinates, opening hours,
 * areaServed (Algarve, Portugal) and a small offer catalog.
 */
export function localBusinessLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${base()}/#business`,
    name: "Reddune Solutions",
    description:
      "Assistência técnica informática, montagem de PCs, desenvolvimento web/app e recuperação de dados no Algarve.",
    url: base(),
    logo: `${base()}/logo.png`,
    image: `${base()}/opengraph-image`,
    telephone: contactInfo.phone,
    email: contactInfo.email,
    priceRange: "€€",
    address: {
      "@type": "PostalAddress",
      addressLocality: LOCATION.city,
      addressRegion: LOCATION.region,
      addressCountry: "PT",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: LOCATION.lat,
      longitude: LOCATION.lng,
    },
    areaServed: [
      { "@type": "AdministrativeArea", name: LOCATION.region },
      { "@type": "Country", name: LOCATION.country },
    ],
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "18:00",
      },
    ],
    sameAs: [contactInfo.instagramUrl],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Serviços de Informática",
      itemListElement: [
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Assistência Técnica" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Desenvolvimento Web" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Recuperação de Dados" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Montagem de PCs" } },
      ],
    },
  };
}

/**
 * Service + Offer — service sub-page (/servicos/[slug]).
 */
export function serviceLd(params: {
  slug: string;
  name: string;
  description: string;
  priceFrom?: number;
}): JsonLd {
  const { slug, name, description, priceFrom } = params;
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${base()}/servicos/${slug}#service`,
    name,
    description,
    url: `${base()}/servicos/${slug}`,
    provider: {
      "@type": "LocalBusiness",
      "@id": `${base()}/#business`,
      name: "Reddune Solutions",
    },
    areaServed: [
      { "@type": "AdministrativeArea", name: LOCATION.region },
      { "@type": "Country", name: LOCATION.country },
    ],
    ...(priceFrom !== undefined && {
      offers: {
        "@type": "Offer",
        priceCurrency: "EUR",
        priceSpecification: {
          "@type": "PriceSpecification",
          priceCurrency: "EUR",
          price: priceFrom,
          minPrice: priceFrom,
          valueAddedTaxIncluded: true,
        },
        availability: "https://schema.org/InStock",
      },
    }),
  };
}

/**
 * ItemList — shop catalog (/loja).
 */
export function itemListLd(params: {
  url: string;
  name: string;
  items: Array<{ id: string; name: string; price: number; url?: string; image?: string }>;
}): JsonLd {
  const { url, name, items } = params;
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    url,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        "@id": `${base()}/loja#${item.id}`,
        name: item.name,
        ...(item.image && { image: item.image }),
        offers: {
          "@type": "Offer",
          priceCurrency: "EUR",
          price: item.price,
          availability: "https://schema.org/InStock",
        },
      },
    })),
  };
}

/**
 * FAQPage — used by service sub-pages with FAQ accordion.
 */
export function faqPageLd(
  faqs: Array<{ question: string; answer: string }>,
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    })),
  };
}

/**
 * Render a JSON-LD payload as a `<script>` element. Use as a child anywhere
 * server-rendered output is allowed; React strips this from the body in SSR.
 */
export function jsonLdScript(ld: JsonLd): string {
  return JSON.stringify(ld);
}
