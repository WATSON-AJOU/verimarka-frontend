import verimarkaLogo from "../assets/verimarka.png";

type ErrorPageProps = {
  statusCode: 403 | 404;
};

export default function ErrorPage({ statusCode }: ErrorPageProps) {
  return (
    <main className="error-page" aria-labelledby="error-page-title">
      <section className="error-page-content">
        <div className="error-page-code">{statusCode}</div>
        <h1 id="error-page-title">페이지를 찾을 수 없습니다.</h1>
        <img className="error-page-logo" src={verimarkaLogo} alt="VeriMarka" />
        <p>더 나은 서비스를 제공하도록 노력하겠습니다.</p>
        <a className="error-page-mail" href="mailto:emfpdlzj@gmail.com">
          문의메일: emfpdlzj@gmail.com
        </a>
      </section>
    </main>
  );
}
