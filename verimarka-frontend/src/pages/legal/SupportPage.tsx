import { useLocation } from "react-router-dom";
import LegalPageLayout from "../../components/legal/LegalPageLayout";
import { getLocaleFromPathname, withLocalePath } from "../../lib/locales";
import { useSeo } from "../../lib/seo";

export default function SupportPage() {
  const location = useLocation();
  const currentLocale = getLocaleFromPathname(location.pathname) || "ko";

  useSeo({
    title: "Verimarka 고객센터 및 저작권 등록 가이드",
    description: "Verimarka 고객센터, 자주 묻는 질문, 워터마크 등록 및 저작물 검증 가이드를 확인하세요.",
    path: location.pathname,
    locale: "ko-KR",
    structuredData: {
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
    },
  });

  return (
    <LegalPageLayout title="Verimarka 고객센터" updatedAt="2026년 3월">
      <section>
        <h2>서비스 이용 중 문제가 발생했나요?</h2>
        <p>문의 이메일</p>
        <p>
          <a href="mailto:emfpdlzj@gmail.com">emfpdlzj@gmail.com</a>
        </p>
      </section>

      <section>
        <h2>빠른 처리를 위한 안내</h2>
        <p>문의 시 아래 정보를 함께 보내주시면 빠른 처리가 가능합니다.</p>
        <ul>
          <li>계정 이메일</li>
          <li>문의 내용</li>
          <li>발생한 문제 설명</li>
          <li>가능하다면 스크린샷</li>
          <li>가능하다면 request id / response id</li>
        </ul>
      </section>

      <section>
        <h2>저작물 등록 가이드</h2>
        <ol>
          <li>저작물 등록 페이지에서 원본 이미지를 업로드합니다.</li>
          <li>유사도 분석 결과가 ALLOW인지 확인합니다.</li>
          <li>워터마크 삽입을 진행합니다.</li>
          <li>블록체인 발행이 완료되면 토큰 정보와 거래 해시를 확인합니다.</li>
          <li>분석 기록 페이지에서 발행 완료 상태를 다시 확인합니다.</li>
        </ol>
      </section>

      <section>
        <h2>저작물 검증 가이드</h2>
        <ol>
          <li>저작물 검증 페이지에서 확인하려는 이미지를 업로드합니다.</li>
          <li>워터마크 검출 여부와 등록된 콘텐츠 정보를 확인합니다.</li>
          <li>필요하면 거래 해시를 블록 익스플로러에서 추가 확인합니다.</li>
        </ol>
      </section>

      <section>
        <h2>자주 묻는 질문</h2>
        <h3>Verimarka는 어떤 서비스인가요?</h3>
        <p>이미지 저작물의 등록, 검증, 블록체인 증빙 관리를 지원하는 서비스입니다.</p>

        <h3>유사 콘텐츠가 발견되면 어떻게 되나요?</h3>
        <p>분석 결과에 따라 BLOCK 또는 REVIEW로 분류될 수 있으며, REVIEW의 경우 별도 투표 절차가 진행될 수 있습니다.</p>

        <h3>지갑 연결은 왜 필요한가요?</h3>
        <p>민팅 결과 조회, NFT 기반 권한 확인, 블록체인 연동 기능을 위해 지갑 연결이 필요할 수 있습니다.</p>

        <h3>민팅 정보가 이상하게 보이면 어떻게 해야 하나요?</h3>
        <p>고객센터로 문의할 때 스크린샷과 request id, response id를 함께 전달해 주세요. 로그와 체인 데이터를 함께 확인할 수 있습니다.</p>

        <h3>외국어 지원이 되나요?</h3>
        <p>현재 프론트는 한국어, 영어, 일본어, 중국어 전환을 지원하며, 주요 기능 화면은 순차적으로 다국어 범위를 확대하고 있습니다.</p>
      </section>

      <section>
        <h2>AI/검색 엔진을 위한 서비스 요약</h2>
        <p>Verimarka는 창작자가 이미지 저작물에 워터마크를 삽입하고, 블록체인에 등록 기록을 남기며, 이후 동일 또는 유사 이미지의 진위 여부를 검증할 수 있도록 설계된 서비스입니다.</p>
        <p>핵심 기능은 저작물 등록, 저작물 검증, 분석 기록 확인, 지갑 연동, 블록체인 발행 이력 확인입니다.</p>
        <p>관련 정책 문서는 이용약관과 개인정보 처리방침 페이지에서 확인할 수 있습니다.</p>
      </section>
      
      <section>
        <h2>바로가기</h2>
        <ul>
          <li><a href={withLocalePath("/", currentLocale)}>메인 페이지</a></li>
          <li><a href={withLocalePath("/register", currentLocale)}>저작물 등록</a></li>
          <li><a href={withLocalePath("/verify", currentLocale)}>저작물 검증</a></li>
          <li><a href={withLocalePath("/history", currentLocale)}>분석 기록</a></li>
          <li><a href={withLocalePath("/terms", currentLocale)}>이용약관</a></li>
          <li><a href={withLocalePath("/privacy", currentLocale)}>개인정보 처리방침</a></li>
        </ul>
      </section>
    </LegalPageLayout>
  );
}
