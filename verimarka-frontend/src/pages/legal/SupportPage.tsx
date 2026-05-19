import { useLocation } from "react-router-dom";
import kakaoLogo from "../../assets/kakaologo.svg";
import LegalPageLayout from "../../components/legal/LegalPageLayout";
import { getLocaleFromPathname, withLocalePath } from "../../lib/locales";
import { useSeo } from "../../lib/seo";

const KAKAO_CHANNEL_URL = "http://pf.kakao.com/_xhtpsX";

const localeSeoMap = {
  ko: "ko-KR",
  en: "en-US",
  ja: "ja-JP",
  "zh-CN": "zh-CN",
} as const;

export default function SupportPage() {
  const location = useLocation();
  const currentLocale = getLocaleFromPathname(location.pathname) || "ko";

  useSeo({
    title: "Verimarka 고객센터 및 저작권 등록 가이드",
    description: "Verimarka 고객센터, 자주 묻는 질문, 워터마크 등록 및 저작물 검증 가이드를 확인하세요.",
    path: location.pathname,
    locale: localeSeoMap[currentLocale],
    alternateGroup: "support",
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
            text: "계정 이메일, 문의 유형, 발생 시각, 문제 설명, 가능하다면 스크린샷과 request id 또는 response id를 함께 보내주시면 빠른 확인이 가능합니다.",
          },
        },
      ],
    },
  });

  return (
    <LegalPageLayout title="Verimarka 고객센터" updatedAt="2026년 5월">
      <section>
        <h2>서비스 이용 중 문제가 발생했나요?</h2>
        <p>문의, 권리 침해 신고, 개인정보 요청, 환불 문의는 카카오톡 상담채널 또는 이메일로 접수할 수 있습니다.</p>
        <div className="support-contact-panel" aria-label="고객센터 접수 채널">
          <a className="support-kakao-button" href={KAKAO_CHANNEL_URL} target="_blank" rel="noreferrer">
            <img src={kakaoLogo} alt="" aria-hidden="true" />
            <span>카톡상담채널</span>
          </a>
          <dl className="support-contact-list">
            <div>
              <dt>문의 메일</dt>
              <dd><a href="mailto:emfpdlzj@gmail.com">emfpdlzj@gmail.com</a></dd>
            </div>
            <div>
              <dt>운영 시간</dt>
              <dd>평일 10:00-18:00</dd>
            </div>
            <div>
              <dt>답변 예상 시간</dt>
              <dd>영업일 기준 1-2일</dd>
            </div>
          </dl>
        </div>
      </section>

      <section>
        <h2>빠른 처리를 위한 안내</h2>
        <p>문의 시 아래 정보를 함께 보내주시면 빠른 처리가 가능합니다.</p>
        <ul>
          <li>계정 이메일</li>
          <li>문의 유형: 계정, 등록, 검증, 민팅, 투표, 결제, 개인정보, 권리 침해</li>
          <li>발생 시각과 이용한 화면</li>
          <li>발생한 문제 설명 및 기대한 동작</li>
          <li>가능하다면 스크린샷</li>
          <li>가능하다면 request id / response id</li>
          <li>블록체인 관련 문의인 경우 지갑 주소, 거래 해시, 토큰 ID</li>
        </ul>
      </section>

      <section>
        <h2>문의 유형별 접수 안내</h2>
        <h3>계정 및 인증</h3>
        <p>로그인, 이메일 인증, 휴대전화 인증, 계정 탈퇴, 탈퇴 계정 재문의는 가입 이메일과 발생 시각을 함께 보내주세요.</p>

        <h3>등록 및 검증 오류</h3>
        <p>파일명, 파일 형식, 파일 크기, 분석 결과 화면, request id 또는 response id를 함께 보내주세요. 원본 파일에는 민감정보나 고유식별정보를 포함하지 않도록 주의해 주세요.</p>

        <h3>블록체인 및 지갑</h3>
        <p>지갑 주소, 네트워크, 거래 해시, 토큰 ID, 지갑 승인 화면의 오류 메시지를 함께 보내주세요.</p>

        <h3>권리 침해 신고</h3>
        <p>신고 대상 콘텐츠를 식별할 수 있는 정보, 본인이 권리자임을 확인할 수 있는 자료, 침해 주장 사유, 연락 가능한 이메일을 보내주세요. 접수 후 필요한 경우 추가 자료를 요청할 수 있습니다.</p>

        <h3>개인정보 요청</h3>
        <p>개인정보 열람, 정정, 삭제, 처리정지 요청은 본인 확인 후 처리됩니다. 처리 결과는 접수 이메일로 안내합니다.</p>
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

        <h3>검증 결과가 저작권 소유를 확정하나요?</h3>
        <p>아니요. 검증 결과는 워터마크, 유사도, 블록체인 기록을 바탕으로 한 기술적 참고 정보이며 법적 소유권 판단이나 분쟁 해결을 보장하지 않습니다.</p>

        <h3>업로드한 원본 파일을 삭제할 수 있나요?</h3>
        <p>계정 기능 또는 고객센터를 통해 삭제를 요청할 수 있습니다. 단, 법령상 보존이 필요한 기록과 블록체인에 이미 기록된 정보는 삭제가 제한될 수 있습니다.</p>

        <h3>결제 또는 환불 문의는 어떻게 하나요?</h3>
        <p>유료 기능이 제공되는 경우 결제일, 결제수단, 주문 또는 거래 식별자, 문제 내용을 함께 보내주세요. 유료 기능 출시 전 가격, 청약철회, 환불 기준은 별도 고지되어야 합니다.</p>
      </section>

      <section>
        <h2>운영 고지 체크리스트</h2>
        <p>서비스 운영자는 정식 배포 전 다음 항목을 확정해 고객센터, 이용약관, 개인정보 처리방침에 반영해야 합니다.</p>
        <ul>
          <li>사업자명, 대표자명, 사업장 주소, 사업자등록번호</li>
          <li>통신판매업 신고번호, 전화번호, 고객센터 운영 시간</li>
          <li>개인정보 보호책임자 또는 담당 부서와 연락처</li>
          <li>클라우드 저장소, 이메일, SMS, 오류 모니터링, 블록체인/IPFS 등 수탁자 정보</li>
          <li>유료 서비스가 있는 경우 가격, 결제수단, 청약철회 제한 사유, 환불 기준</li>
        </ul>
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
