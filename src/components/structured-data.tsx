import { localBusinessLd, jsonLdScript } from "@/lib/structured-data";

/**
 * StructuredData — base LocalBusiness JSON-LD injected at the root layout
 * level so every page inherits the org-level schema. Per-route augmentations
 * (Service, ItemList, FAQPage) are added directly inside each page.
 */
export function StructuredData() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLdScript(localBusinessLd()) }}
    />
  );
}
