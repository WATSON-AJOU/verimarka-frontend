import verimarkaLogo from "../assets/verimarka.webp";
import { buildTabPath } from "../lib/app-utils";

type ErrorPageProps = {
  statusCode: 403 | 404 | 500;
  title?: string;
  description?: string;
  supportText?: string;
  showReload?: boolean;
};

const ERROR_COPY: Record<ErrorPageProps["statusCode"], { title: string; description: string }> = {
  403: {
    title: "접근할 수 없는 화면입니다.",
    description: "로그인 상태나 권한을 확인한 뒤 다시 시도해주세요.",
  },
  404: {
    title: "페이지를 찾을 수 없습니다.",
    description: "주소가 바뀌었거나 더 이상 제공되지 않는 화면일 수 있습니다.",
  },
  500: {
    title: "일시적인 문제가 발생했습니다.",
    description: "서비스 이용 중 문제가 생겼습니다. 잠시 후 다시 시도해주세요.",
  },
};

export default function ErrorPage({
  statusCode,
  title,
  description,
  supportText = "더 나은 서비스를 제공하도록 노력하겠습니다.",
  showReload = false,
}: ErrorPageProps) {
  const copy = ERROR_COPY[statusCode];

  return (
    <main className="error-page" aria-labelledby="error-page-title">
      <section className="error-page-content">
        <div className="error-page-code">{statusCode}</div>
        <h1 id="error-page-title">{title || copy.title}</h1>
        <img className="error-page-logo" src={verimarkaLogo} alt="VeriMarka" />
        <p>{description || copy.description}</p>
        <p className="error-page-support">{supportText}</p>
        <div className="error-page-actions" aria-label="오류 해결 동작">
          {showReload ? (
            <button className="btn btn-primary" type="button" onClick={() => window.location.reload()}>
              다시 불러오기
            </button>
          ) : null}
          <a className="btn btn-secondary" href={buildTabPath("home")}>
            홈으로 이동
          </a>
        </div>
        <a className="error-page-mail" href="mailto:emfpdlzj@gmail.com">
          문의메일: emfpdlzj@gmail.com
        </a>
      </section>
    </main>
  );
}
