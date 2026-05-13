import { useTranslations } from "next-intl";
import { PageHero } from "@/components/sections/PageHero";

export function ShopHero() {
  const t = useTranslations("ShopPage.hero");

  return (
    <PageHero
      title={t("title")}
      description={t("description")}
    />
  );
}
