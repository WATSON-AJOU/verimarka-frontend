import { buildTabPath } from "../../lib/app-utils";

type OAuthCallbackStatusProps = {
  provider: string;
  errorMessage?: string;
};

export default function OAuthCallbackStatus({ provider, errorMessage }: OAuthCallbackStatusProps) {
  const hasError = Boolean(errorMessage);

  return (
    <main className="oauth-callback-page" aria-live="polite">
      <section className="oauth-callback-panel" aria-labelledby="oauth-callback-title">
        <div className={hasError ? "oauth-callback-status is-error" : "oauth-callback-status"} aria-hidden="true">
          {hasError ? "!" : "..."}
        </div>
        <h1 id="oauth-callback-title">
          {hasError ? `${provider} 로그인을 완료하지 못했습니다.` : `${provider} 로그인 처리 중입니다.`}
        </h1>
        <p>
          {hasError
            ? errorMessage || "로그인 중 문제가 발생했습니다. 홈으로 돌아가 다시 시도해주세요."
            : "인증 결과를 확인하고 있습니다. 잠시만 기다려주세요."}
        </p>
        {hasError ? (
          <div className="oauth-callback-actions">
            <a className="btn btn-primary" href={buildTabPath("home")}>
              홈으로 이동
            </a>
          </div>
        ) : null}
      </section>
    </main>
  );
}
