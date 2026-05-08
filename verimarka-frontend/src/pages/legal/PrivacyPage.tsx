import { useLocation } from "react-router-dom";
import LegalPageLayout from "../../components/legal/LegalPageLayout";
import { useSeo } from "../../lib/seo";

export default function PrivacyPage() {
  const location = useLocation();

  useSeo({
    title: "Verimarka 개인정보 처리방침",
    description: "Verimarka 개인정보 처리방침입니다. 수집 항목, 이용 목적, 보관 기간, 보호 조치, 이용자 권리를 확인할 수 있습니다.",
    path: location.pathname,
    locale: "ko-KR",
  });

  return (
    <LegalPageLayout title="Verimarka 개인정보 처리방침" updatedAt="2026년 3월">
      <section>
        <h2>1. 수집하는 개인정보</h2>
        <p>서비스는 다음 정보를 수집할 수 있습니다.</p>
        <p>회원가입 시</p>
        <ul>
          <li>이메일</li>
          <li>닉네임</li>
          <li>비밀번호 (암호화 저장)</li>
        </ul>
        <p>OAuth 로그인 시</p>
        <ul>
          <li>이메일</li>
          <li>이름</li>
          <li>프로필 이미지</li>
        </ul>
      </section>

      <section>
        <h2>2. 개인정보 이용 목적</h2>
        <p>수집된 개인정보는 다음 목적을 위해 사용됩니다.</p>
        <ul>
          <li>회원 식별</li>
          <li>서비스 제공</li>
          <li>고객 문의 대응</li>
          <li>서비스 개선</li>
        </ul>
      </section>

      <section>
        <h2>3. 개인정보 보관 기간</h2>
        <p>
          회원 탈퇴 시 개인정보는 즉시 삭제됩니다. 단, 법령에 따라 보관이 필요한 경우 해당
          기간 동안 보관됩니다.
        </p>
      </section>

      <section>
        <h2>4. 개인정보 제3자 제공</h2>
        <p>서비스는 이용자의 개인정보를 제3자에게 제공하지 않습니다.</p>
        <p>단, 다음 경우는 예외입니다.</p>
        <ul>
          <li>이용자 동의가 있는 경우</li>
          <li>법령에 따른 요청이 있는 경우</li>
        </ul>
      </section>

      <section>
        <h2>5. 개인정보 보호</h2>
        <p>서비스는 개인정보 보호를 위해 다음 조치를 시행합니다.</p>
        <ul>
          <li>암호화된 비밀번호 저장</li>
          <li>접근 권한 제한</li>
          <li>보안 시스템 운영</li>
        </ul>
      </section>

      <section>
        <h2>6. 이용자의 권리</h2>
        <p>이용자는 언제든지 다음 권리를 행사할 수 있습니다.</p>
        <ul>
          <li>개인정보 조회</li>
          <li>개인정보 수정</li>
          <li>회원 탈퇴</li>
        </ul>
      </section>

      <section>
        <h2>7. 문의</h2>
        <p>개인정보 관련 문의는 아래 이메일로 연락할 수 있습니다.</p>
        <p>
          <a href="mailto:emfpdlzj@gmail.com">emfpdlzj@gmail.com</a>
        </p>
      </section>
    </LegalPageLayout>
  );
}
