export default function Footer() {
  return (
    <footer className="footer">
      <div className="footerContent">
        <h2>VeriMarka Cloud</h2>

        <div className="footerLinks">
          <button type="button">서비스 이용약관</button>
          <button type="button">개인정보처리방침</button>
          <button type="button">인재채용</button>
          <button type="button">제휴 문의</button>
        </div>

        <p>사업자등록번호: 000-00-00000 | 통신판매업신고번호: 제2026-경기수원-0000</p>
        <p>주소: 서울특별시 아주로 100, VeriMarka 아주팩토리, 12345</p>
        <p>© VeriMarka Corp. All Rights Reserved.</p>
      </div>

      <button className="outlineActionButton footerLang">한국어 ▾</button>
    </footer>
  );
}