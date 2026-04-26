import { useEffect } from "react";

const SITE_NAME = "VeriMarka";
const DEFAULT_SITE_URL = "https://verimarka.com";
const DEFAULT_IMAGE_PATH = "/verimarka-og.png";
const DEFAULT_INDEX_ROBOTS = "index, follow, max-image-preview:large";
const JSON_LD_SCRIPT_ID = "verimarka-jsonld";

type StructuredData = Record<string, unknown> | Array<Record<string, unknown>>;

export interface SeoOptions {
  title: string;
  description: string;
  path?: string;
  imagePath?: string;
  type?: string;
  robots?: string;
  structuredData?: StructuredData;
  locale?: string;
}

function getSiteUrl() {
  const envSiteUrl = import.meta.env.VITE_SITE_URL?.trim();
  if (envSiteUrl) return envSiteUrl.replace(/\/+$/, "");

  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin.replace(/\/+$/, "");
  }

  return DEFAULT_SITE_URL;
}

export function buildAbsoluteUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, `${getSiteUrl()}/`).toString();
}

function upsertMeta(selector: string, attributeName: "name" | "property", attributeValue: string, content: string) {
  if (typeof document === "undefined") return;

  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function upsertLink(selector: string, rel: string, href: string) {
  if (typeof document === "undefined") return;

  let element = document.head.querySelector<HTMLLinkElement>(selector);
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }
  element.setAttribute("href", href);
}

function updateStructuredData(structuredData?: StructuredData) {
  if (typeof document === "undefined") return;

  const existingScript = document.getElementById(JSON_LD_SCRIPT_ID);
  if (!structuredData) {
    existingScript?.remove();
    return;
  }

  const payload = Array.isArray(structuredData)
    ? {
        "@context": "https://schema.org",
        "@graph": structuredData.map((item) => {
          if ("@context" in item) {
            const { "@context": _ignored, ...rest } = item;
            return rest;
          }
          return item;
        }),
      }
    : structuredData;

  const scriptElement = existingScript ?? document.createElement("script");
  scriptElement.id = JSON_LD_SCRIPT_ID;
  scriptElement.setAttribute("type", "application/ld+json");
  scriptElement.textContent = JSON.stringify(payload);

  if (!existingScript) {
    document.head.appendChild(scriptElement);
  }
}

export function useSeo({
  title,
  description,
  path = "/",
  imagePath = DEFAULT_IMAGE_PATH,
  type = "website",
  robots = DEFAULT_INDEX_ROBOTS,
  structuredData,
  locale = "ko-KR",
}: SeoOptions) {
  useEffect(() => {
    const absoluteUrl = buildAbsoluteUrl(path);
    const absoluteImageUrl = buildAbsoluteUrl(imagePath);
    const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;

    document.title = fullTitle;
    document.documentElement.lang = locale;

    upsertMeta('meta[name="description"]', "name", "description", description);
    upsertMeta('meta[name="robots"]', "name", "robots", robots);
    upsertMeta('meta[property="og:type"]', "property", "og:type", type);
    upsertMeta('meta[property="og:site_name"]', "property", "og:site_name", SITE_NAME);
    upsertMeta('meta[property="og:title"]', "property", "og:title", fullTitle);
    upsertMeta('meta[property="og:description"]', "property", "og:description", description);
    upsertMeta('meta[property="og:url"]', "property", "og:url", absoluteUrl);
    upsertMeta('meta[property="og:image"]', "property", "og:image", absoluteImageUrl);
    upsertMeta('meta[property="og:locale"]', "property", "og:locale", toOpenGraphLocale(locale));
    upsertMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
    upsertMeta('meta[name="twitter:title"]', "name", "twitter:title", fullTitle);
    upsertMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
    upsertMeta('meta[name="twitter:image"]', "name", "twitter:image", absoluteImageUrl);
    upsertLink('link[rel="canonical"]', "canonical", absoluteUrl);
    updateStructuredData(structuredData);

    return () => {
      updateStructuredData(undefined);
    };
  }, [description, imagePath, locale, path, robots, structuredData, title, type]);
}

export function toOpenGraphLocale(locale: string) {
  const normalizedLocale = locale.toLowerCase();
  if (normalizedLocale === "en" || normalizedLocale === "en-us") return "en_US";
  if (normalizedLocale === "ja" || normalizedLocale === "ja-jp") return "ja_JP";
  if (normalizedLocale === "zh-cn") return "zh_CN";
  return "ko_KR";
}

export function getDefaultOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: buildAbsoluteUrl("/"),
    logo: buildAbsoluteUrl("/logo.svg"),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "emfpdlzj@gmail.com",
      availableLanguage: ["Korean", "English", "Japanese", "Chinese"],
    },
  };
}

export function getDefaultWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: buildAbsoluteUrl("/"),
    inLanguage: ["ko-KR", "en-US", "ja-JP", "zh-CN"],
  };
}
