import LegalPageLayout from "../../components/legal/LegalPageLayout";
import { useSeo } from "../../lib/seo";

export default function TermsPage() {
  useSeo({
    title: "Verimarka 이용약관",
    description: "Verimarka 서비스 이용약관입니다. 콘텐츠 등록, 검증, 계정 이용, 서비스 운영 정책 관련 기본 조건을 안내합니다.",
    path: "/terms",
    locale: "ko-KR",
  });

  return (
    <LegalPageLayout title="Verimarka 이용약관" updatedAt="2026년 3월">
      <section>
        <h2>제1조 목적</h2>
        <p>
          본 약관은 Verimarka(이하 “서비스”)가 제공하는 콘텐츠 등록 및 검증 서비스의 이용과
          관련하여 서비스와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
        </p>
      </section>

      <section>
        <h2>제2조 서비스 내용</h2>
        <p>Verimarka는 다음과 같은 기능을 제공합니다.</p>
        <ul>
          <li>콘텐츠 등록 및 관리</li>
          <li>콘텐츠 검증 및 정보 제공</li>
          <li>사용자 계정 관리</li>
          <li>기타 서비스 운영을 위한 기능</li>
        </ul>
        <p>서비스 내용은 운영 정책에 따라 변경될 수 있습니다.</p>
      </section>

      <section>
        <h2>제3조 회원가입</h2>
        <p>이용자는 다음 정보를 제공하여 회원가입을 할 수 있습니다.</p>
        <ul>
          <li>이메일</li>
          <li>닉네임</li>
          <li>비밀번호</li>
        </ul>
        <p>OAuth 로그인을 이용하는 경우 서비스는 다음 정보를 제공받을 수 있습니다.</p>
        <ul>
          <li>이메일</li>
          <li>사용자 이름</li>
          <li>프로필 이미지</li>
        </ul>
      </section>

      <section>
        <h2>제4조 이용자의 의무</h2>
        <p>이용자는 다음 행위를 해서는 안 됩니다.</p>
        <ul>
          <li>타인의 개인정보 도용</li>
          <li>서비스 운영 방해</li>
          <li>불법 콘텐츠 등록</li>
          <li>저작권 침해</li>
        </ul>
      </section>

      <section>
        <h2>제5조 서비스 제공의 중단</h2>
        <p>서비스는 다음 경우 중단될 수 있습니다.</p>
        <ul>
          <li>시스템 점검</li>
          <li>서비스 개편</li>
          <li>불가항력적 상황</li>
        </ul>
      </section>

      <section>
        <h2>제6조 책임 제한</h2>
        <p>서비스는 이용자가 등록한 콘텐츠의 정확성 및 적법성에 대해 책임을 지지 않습니다.</p>
      </section>

      <section>
        <h2>제7조 약관 변경</h2>
        <p>서비스는 필요 시 약관을 변경할 수 있으며 변경된 약관은 공지 후 적용됩니다.</p>
      </section>
    </LegalPageLayout>
  );
}
