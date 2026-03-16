export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-main">
          <div className="footer-topline">
            <h2 className="footer-logo">VeriMarka</h2>
            <div className="footer-links">
              <a href="/terms">이용약관</a>
              <a href="/privacy">개인정보처리방침</a>
              <a href="/support">고객센터</a>
            </div>
          </div>

          <div className="footer-info">
            <p>
              사업자등록번호: 123-45-67890 <span>|</span> 통신판매업신고번호: 제2026-서울성동-0001
              <span>|</span> 전화문의: 1544-5678
            </p>
            <p>주소: 서울특별시 성동구 예시로 100, VeriMarka 그린팩토리, 12345</p>
          </div>

          <p className="footer-copy">© VeriMarka Corp. All Rights Reserved.</p>
        </div>

        <div className="lang-switch lang-switch-footer">
          <button className="footer-lang" type="button">
            한국어
            <span className="lang-caret">⌄</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
