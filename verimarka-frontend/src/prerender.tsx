import { StrictMode, type ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import PrivacyPage from "./pages/legal/PrivacyPage";
import SupportPage from "./pages/legal/SupportPage";
import TermsPage from "./pages/legal/TermsPage";

type StructuredData = Record<string, unknown> | Array<Record<string, unknown>>;

interface PrerenderSeo {
  title: string;
  description: string;
  path: string;
  locale: string;
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
      },
    },
  ];
}

const prerenderRoutes: PrerenderRoute[] = [
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
