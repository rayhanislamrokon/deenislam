import type { Metadata } from "next";
import { getSeoForSlug, SITE_URL } from "../seo";

type FeaturePageProps = { params: Promise<{ feature: string }> };

export async function generateMetadata({ params }: FeaturePageProps): Promise<Metadata> {
  const { feature } = await params;
  const seo = getSeoForSlug(feature);
  const canonical = `${SITE_URL}/${feature}`;

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    alternates: { canonical },
    openGraph: {
      type: "website",
      siteName: "Deen Islam",
      url: canonical,
      title: seo.title,
      description: seo.description,
      images: [{ url: "/images/deen-islam-social.png", width: 1200, height: 630, alt: seo.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: ["/images/deen-islam-social.png"],
    },
  };
}

export { default } from "../page";
