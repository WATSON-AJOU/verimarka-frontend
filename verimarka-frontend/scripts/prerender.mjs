import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const SITE_NAME = "VeriMarka";
const SITE_URL = (process.env.VITE_SITE_URL || "https://verimarka.com").replace(/\/+$/, "");
const DEFAULT_IMAGE_PATH = "/verimarka-og.png";
const DEFAULT_ROBOTS = "index, follow, max-image-preview:large";
const ROOT_ID_PATTERN = /<div id="root"><\/div>/;
const LOCALES = ["ko", "en", "ja", "zh-CN"];
const HREFLANG_BY_LOCALE = {
  ko: "ko",
  en: "en",
  ja: "ja",
  "zh-CN": "zh-CN",
};
const PATH_BY_ALTERNATE_GROUP = {
  home: "",
  register: "/register",
  verify: "/verify",
  support: "/support",
  terms: "/terms",
  privacy: "/privacy",
};

const projectRoot = process.cwd();
const clientDist = path.join(projectRoot, "dist");
const ssrEntry = path.join(projectRoot, "dist-ssr", "prerender.js");
const template = await readFile(path.join(clientDist, "index.html"), "utf8");
const { getPrerenderRoutes, renderPrerenderRoute } = await import(pathToFileURL(ssrEntry).href);

function absoluteUrl(pathname) {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return new URL(normalizedPath, `${SITE_URL}/`).toString();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

function toOpenGraphLocale(locale) {
  const normalizedLocale = locale.toLowerCase();
  if (normalizedLocale === "en" || normalizedLocale === "en-us") return "en_US";
  if (normalizedLocale === "ja" || normalizedLocale === "ja-jp") return "ja_JP";
  if (normalizedLocale === "zh-cn") return "zh_CN";
  return "ko_KR";
}

function fullTitle(title) {
  return title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;
}

function metaName(name, content) {
  return `<meta name="${escapeAttribute(name)}" content="${escapeAttribute(content)}" />`;
}

function metaProperty(property, content) {
  return `<meta property="${escapeAttribute(property)}" content="${escapeAttribute(content)}" />`;
}

function buildAlternateLinks(alternateGroup) {
  const suffix = PATH_BY_ALTERNATE_GROUP[alternateGroup];
  if (typeof suffix === "undefined") return [];

  return [
    ...LOCALES.map((locale) => {
      const href = absoluteUrl(`/${locale}${suffix}`);
      return `<link rel="alternate" hreflang="${escapeAttribute(HREFLANG_BY_LOCALE[locale])}" href="${escapeAttribute(href)}" />`;
    }),
    `<link rel="alternate" hreflang="x-default" href="${escapeAttribute(absoluteUrl(`/ko${suffix}`))}" />`,
  ];
}

function normalizeStructuredData(structuredData) {
  if (!structuredData) return null;
  if (!Array.isArray(structuredData)) return structuredData;

  return {
    "@context": "https://schema.org",
    "@graph": structuredData.map((item) => {
      const { "@context": _ignored, ...rest } = item;
      return rest;
    }),
  };
}

function buildHead(seo) {
  const title = fullTitle(seo.title);
  const canonicalUrl = absoluteUrl(seo.path);
  const imageUrl = absoluteUrl(seo.imagePath || DEFAULT_IMAGE_PATH);
  const tags = [
    `<title>${escapeHtml(title)}</title>`,
    metaName("description", seo.description),
    metaName("robots", seo.robots || DEFAULT_ROBOTS),
    metaProperty("og:type", seo.type || "website"),
    metaProperty("og:site_name", SITE_NAME),
    metaProperty("og:title", title),
    metaProperty("og:description", seo.description),
    metaProperty("og:url", canonicalUrl),
    metaProperty("og:image", imageUrl),
    metaProperty("og:locale", toOpenGraphLocale(seo.locale)),
    metaName("twitter:card", "summary_large_image"),
    metaName("twitter:title", title),
    metaName("twitter:description", seo.description),
    metaName("twitter:image", imageUrl),
    `<link rel="canonical" href="${escapeAttribute(canonicalUrl)}" />`,
    ...buildAlternateLinks(seo.alternateGroup),
  ];
  const structuredData = normalizeStructuredData(seo.structuredData);

  if (structuredData) {
    tags.push(`<script id="verimarka-jsonld" type="application/ld+json">${JSON.stringify(structuredData).replace(/</g, "\\u003c")}</script>`);
  }

  return tags.join("\n  ");
}

function stripExistingSeo(html) {
  return html
    .replace(/<title>[\s\S]*?<\/title>\s*/i, "")
    .replace(/\s*<meta\s+name="description"[\s\S]*?>/gi, "")
    .replace(/\s*<meta\s+name="robots"[\s\S]*?>/gi, "")
    .replace(/\s*<meta\s+property="og:[^"]+"[\s\S]*?>/gi, "")
    .replace(/\s*<meta\s+name="twitter:[^"]+"[\s\S]*?>/gi, "")
    .replace(/\s*<link\s+rel="canonical"[\s\S]*?>/gi, "")
    .replace(/\s*<link\s+rel="alternate"[\s\S]*?>/gi, "")
    .replace(/\s*<script\s+id="verimarka-jsonld"[\s\S]*?<\/script>/gi, "");
}

function outputPathForRoute(routePath) {
  const segments = routePath.split("/").filter(Boolean);
  return path.join(clientDist, ...segments, "index.html");
}

function renderHtml(routePath) {
  const { appHtml, seo } = renderPrerenderRoute(routePath);
  const headHtml = buildHead(seo);
  const strippedTemplate = stripExistingSeo(template);
  const htmlWithLang = strippedTemplate.replace(/<html([^>]*)\slang="[^"]*"/i, `<html$1 lang="${escapeAttribute(seo.locale)}"`);
  const htmlWithHead = htmlWithLang.replace("</head>", `  ${headHtml}\n</head>`);

  if (!ROOT_ID_PATTERN.test(htmlWithHead)) {
    throw new Error("Could not find root element in dist/index.html");
  }

  return htmlWithHead.replace(ROOT_ID_PATTERN, `<div id="root">${appHtml}</div>`);
}

for (const routePath of getPrerenderRoutes()) {
  const outputPath = outputPathForRoute(routePath);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, renderHtml(routePath));
  console.log(`prerendered ${routePath} -> ${path.relative(projectRoot, outputPath)}`);
}

process.exit(0);
