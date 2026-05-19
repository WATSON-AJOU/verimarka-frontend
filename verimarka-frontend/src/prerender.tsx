import { StrictMode, type ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import "./i18n";
import PrivacyPage from "./pages/legal/PrivacyPage";
import SupportPage from "./pages/legal/SupportPage";
import TermsPage from "./pages/legal/TermsPage";
import SeoLandingPage from "./pages/seo/SeoLandingPage";
import type { SupportedLocale } from "./lib/locales";

type StructuredData = Record<string, unknown> | Array<Record<string, unknown>>;

interface PrerenderSeo {
  title: string;
  description: string;
  path: string;
  locale: string;
  alternateGroup: "home" | "register" | "verify" | "support" | "terms" | "privacy";
  structuredData?: StructuredData;
}

interface PrerenderRoute {
  path: string;
  element: ReactNode;
  seo: PrerenderSeo;
}

const localeSeoMap = {
  ko: "ko-KR",
  en: "en-US",
  ja: "ja-JP",
  "zh-CN": "zh-CN",
} as const;

type PrerenderLocale = keyof typeof localeSeoMap;

const localizedSeoCopy = {
  ko: {
    home: {
      title: "블록체인 저작권 증명 및 검증",
      description: "VeriMarka는 창작자가 이미지와 문서 저작물 등록, 워터마크 삽입, 블록체인 증빙, 진위 검증을 한 번에 처리할 수 있게 돕습니다.",
    },
    register: {
      title: "원본 저작물 등록",
      description: "이미지와 문서를 업로드해 유사도 분석, 워터마크 삽입, 블록체인 발행까지 진행하고 저작권 증빙을 남기세요.",
    },
    verify: {
      title: "저작물 진위 검증",
      description: "업로드한 콘텐츠의 워터마크, 등록 이력, 블록체인 발행 정보를 확인해 저작물 출처를 검증하세요.",
    },
  },
  en: {
    home: {
      title: "Blockchain copyright proof and verification",
      description: "VeriMarka helps creators register image and document works, insert watermarks, issue blockchain proof, and verify authenticity.",
    },
    register: {
      title: "Register original content",
      description: "Upload images or documents, run similarity analysis, insert watermarks, and create blockchain copyright evidence.",
    },
    verify: {
      title: "Verify content authenticity",
      description: "Check watermark evidence, registration history, and blockchain issuance information for uploaded content.",
    },
  },
  ja: {
    home: {
      title: "ブロックチェーン著作権証明と検証",
      description: "VeriMarka は作品登録、ウォーターマーク挿入、ブロックチェーン証跡、真正性検証を一つの流れで支援します。",
    },
    register: {
      title: "オリジナル作品を登録",
      description: "画像や文書をアップロードし、類似度分析、ウォーターマーク挿入、ブロックチェーン証明の発行まで進められます。",
    },
    verify: {
      title: "作品の真正性を検証",
      description: "アップロードした作品のウォーターマーク、登録履歴、ブロックチェーン発行情報を確認できます。",
    },
  },
  "zh-CN": {
    home: {
      title: "区块链版权存证与验证",
      description: "VeriMarka 帮助创作者完成作品登记、水印嵌入、区块链存证和内容真实性验证。",
    },
    register: {
      title: "登记原创内容",
      description: "上传图片或文档，进行相似度分析、水印嵌入，并生成区块链版权存证。",
    },
    verify: {
      title: "验证内容真实性",
      description: "检查上传内容的水印证据、登记历史和区块链发行信息。",
    },
  },
} satisfies Record<PrerenderLocale, Record<"home" | "register" | "verify", { title: string; description: string }>>;

function serviceStructuredData(locale: PrerenderLocale, kind: "home" | "register" | "verify", path: string) {
  const copy = localizedSeoCopy[locale][kind];
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "VeriMarka",
      url: "https://verimarka.com/",
      logo: "https://verimarka.com/logo.svg",
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "emfpdlzj@gmail.com",
        availableLanguage: ["Korean", "English", "Japanese", "Chinese"],
      },
    },
    {
      "@context": "https://schema.org",
      "@type": kind === "home" ? "WebSite" : "Service",
      name: copy.title,
      description: copy.description,
      url: `https://verimarka.com${path}`,
      provider: {
        "@type": "Organization",
        name: "VeriMarka",
      },
      inLanguage: localeSeoMap[locale],
    },
  ];
}

function buildMarketingRoutes(locale: PrerenderLocale): PrerenderRoute[] {
  const prefix = `/${locale}` as const;
  return [
    {
      path: prefix,
      element: <SeoLandingPage kind="home" locale={locale as SupportedLocale} />,
      seo: {
        ...localizedSeoCopy[locale].home,
        path: prefix,
        locale: localeSeoMap[locale],
        alternateGroup: "home",
        structuredData: serviceStructuredData(locale, "home", prefix),
      },
    },
    {
      path: `${prefix}/register`,
      element: <SeoLandingPage kind="register" locale={locale as SupportedLocale} />,
      seo: {
        ...localizedSeoCopy[locale].register,
        path: `${prefix}/register`,
        locale: localeSeoMap[locale],
        alternateGroup: "register",
        structuredData: serviceStructuredData(locale, "register", `${prefix}/register`),
      },
    },
    {
      path: `${prefix}/verify`,
      element: <SeoLandingPage kind="verify" locale={locale as SupportedLocale} />,
      seo: {
        ...localizedSeoCopy[locale].verify,
        path: `${prefix}/verify`,
        locale: localeSeoMap[locale],
        alternateGroup: "verify",
        structuredData: serviceStructuredData(locale, "verify", `${prefix}/verify`),
      },
    },
  ];
}

const supportFaqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Verimarka에서는 무엇을 할 수 있나요?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "이미지 기반 저작물을 등록하고 유사도 분석, 워터마크 삽입, 블록체인 발행, 저작물 검증을 진행할 수 있습니다.",
      },
    },
    {
      "@type": "Question",
      name: "저작물 등록은 어떤 순서로 진행되나요?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "이미지 업로드 후 유사도 분석 결과를 확인하고, ALLOW인 경우 워터마크 삽입과 블록체인 발행을 이어서 진행합니다.",
      },
    },
    {
      "@type": "Question",
      name: "저작물 검증은 어떻게 하나요?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "검증 페이지에서 이미지를 업로드하면 워터마크 검출 결과와 등록 이력을 확인할 수 있습니다.",
      },
    },
    {
      "@type": "Question",
      name: "문제가 발생하면 어떤 정보를 전달해야 하나요?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "계정 이메일, 문의 내용, 발생한 문제 설명, 가능하다면 스크린샷과 request id 또는 response id를 함께 보내주시면 빠른 확인이 가능합니다.",
      },
    },
  ],
};

function buildLegalRoutes(prefix: "" | `/${PrerenderLocale}`, locale: PrerenderLocale): PrerenderRoute[] {
  return [
    {
      path: `${prefix}/support`,
      element: <SupportPage />,
      seo: {
        title: "Verimarka 고객센터 및 저작권 등록 가이드",
        description: "Verimarka 고객센터, 자주 묻는 질문, 워터마크 등록 및 저작물 검증 가이드를 확인하세요.",
        path: `${prefix}/support`,
        locale: localeSeoMap[locale],
        alternateGroup: "support",
        structuredData: supportFaqStructuredData,
      },
    },
    {
      path: `${prefix}/terms`,
      element: <TermsPage />,
      seo: {
        title: "Verimarka 이용약관",
        description: "Verimarka 서비스 이용약관입니다. 콘텐츠 등록, 검증, 계정 이용, 서비스 운영 정책 관련 기본 조건을 안내합니다.",
        path: `${prefix}/terms`,
        locale: localeSeoMap[locale],
        alternateGroup: "terms",
      },
    },
    {
      path: `${prefix}/privacy`,
      element: <PrivacyPage />,
      seo: {
        title: "Verimarka 개인정보 처리방침",
        description: "Verimarka 개인정보 처리방침입니다. 수집 항목, 이용 목적, 보관 기간, 보호 조치, 이용자 권리를 확인할 수 있습니다.",
        path: `${prefix}/privacy`,
        locale: localeSeoMap[locale],
        alternateGroup: "privacy",
      },
    },
  ];
}

const prerenderRoutes: PrerenderRoute[] = [
  ...buildMarketingRoutes("ko"),
  ...buildMarketingRoutes("en"),
  ...buildMarketingRoutes("ja"),
  ...buildMarketingRoutes("zh-CN"),
  ...buildLegalRoutes("", "ko"),
  ...buildLegalRoutes("/ko", "ko"),
  ...buildLegalRoutes("/en", "en"),
  ...buildLegalRoutes("/ja", "ja"),
  ...buildLegalRoutes("/zh-CN", "zh-CN"),
];

export function getPrerenderRoutes() {
  return prerenderRoutes.map((route) => route.path);
}

export function renderPrerenderRoute(path: string) {
  const route = prerenderRoutes.find((item) => item.path === path);
  if (!route) {
    throw new Error(`Unknown prerender route: ${path}`);
  }

  const appHtml = renderToString(
    <StrictMode>
      <StaticRouter location={route.path}>{route.element}</StaticRouter>
    </StrictMode>,
  );

  return {
    appHtml,
    seo: route.seo,
  };
}
