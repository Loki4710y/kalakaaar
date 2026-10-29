import React from "react";
import { BRANDING } from "@/src/config/assets";
import { SITE_URL } from "@/src/lib/site";

export interface WebsiteJsonLdProps {
  type: "Website";
  name?: string;
  url?: string;
}

export interface OrganizationJsonLdProps {
  type: "Organization";
  name?: string;
  url?: string;
  logo?: string;
  description?: string;
}

export interface ArtistPersonJsonLdProps {
  type: "Person";
  name: string;
  jobTitle?: string;
  image?: string;
  description?: string;
  knowsAbout?: string[];
  url?: string;
}

export interface ArtworkProductJsonLdProps {
  type: "CreativeWork" | "Product";
  name: string;
  image: string[];
  description: string;
  artistName: string;
  price?: number;
  currency?: string;
  artStyle?: string;
  dimensions?: string;
  url?: string;
}

export interface StoryArticleJsonLdProps {
  type: "Article";
  headline: string;
  image?: string;
  authorName: string;
  datePublished?: string;
  description?: string;
  url?: string;
}

export interface CollectionPageJsonLdProps {
  type: "CollectionPage";
  name: string;
  description?: string;
  url?: string;
  numberOfItems?: number;
}

export type JsonLdProps =
  | WebsiteJsonLdProps
  | OrganizationJsonLdProps
  | ArtistPersonJsonLdProps
  | ArtworkProductJsonLdProps
  | StoryArticleJsonLdProps
  | CollectionPageJsonLdProps;

export function JsonLd(props: JsonLdProps) {
  const baseUrl = SITE_URL;
  let schemaData: Record<string, any> = {};

  switch (props.type) {
    case "Website":
      schemaData = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: props.name || "Kalakaar - India's Living Heritage Platform",
        url: props.url || baseUrl,
        potentialAction: {
          "@type": "SearchAction",
          target: `${baseUrl}/search?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      };
      break;

    case "Organization":
      schemaData = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: props.name || "Kalakaar Cultural Art Collective",
        url: props.url || baseUrl,
        logo: props.logo || `${baseUrl}${BRANDING.logo}`,
        description:
          props.description ||
          "Directly empowering master artisans across Madhubani, Pattachitra, Warli, and Gond traditional art styles.",
      };
      break;

    case "Person":
      schemaData = {
        "@context": "https://schema.org",
        "@type": "Person",
        name: props.name,
        jobTitle: props.jobTitle || "Master Artisan",
        image: props.image,
        description: props.description,
        knowsAbout: props.knowsAbout || ["Indian Folk Art", "Madhubani", "Pattachitra"],
        url: props.url,
      };
      break;

    case "CreativeWork":
    case "Product":
      schemaData = {
        "@context": "https://schema.org",
        "@type": "VisualArtwork",
        name: props.name,
        image: props.image,
        description: props.description,
        artist: {
          "@type": "Person",
          name: props.artistName,
        },
        artform: props.artStyle || "Traditional Indian Folk Painting",
        width: props.dimensions,
        offers: props.price
          ? {
              "@type": "Offer",
              price: props.price,
              priceCurrency: props.currency || "INR",
              availability: "https://schema.org/InStock",
            }
          : undefined,
      };
      break;

    case "Article":
      schemaData = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: props.headline,
        image: props.image ? [props.image] : undefined,
        author: {
          "@type": "Person",
          name: props.authorName,
        },
        publisher: {
          "@type": "Organization",
          name: "Kalakaar Lore Archives",
          logo: {
            "@type": "ImageObject",
            url: `${baseUrl}${BRANDING.logo}`,
          },
        },
        datePublished: props.datePublished || new Date().toISOString(),
        description: props.description,
      };
      break;

    case "CollectionPage":
      schemaData = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: props.name,
        description: props.description,
        url: props.url,
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: props.numberOfItems || 0,
        },
      };
      break;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData).replace(/</g, '\\u003c') }}
    />
  );
}
