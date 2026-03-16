import LegalPageLayout from "../../components/legal/LegalPageLayout";

export default function SupportPage() {
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
        </ul>
      </section>
    </LegalPageLayout>
  );
}
