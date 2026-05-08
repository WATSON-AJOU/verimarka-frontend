import { useLocation } from "react-router-dom";
import { getLocaleFromPathname, withLocalePath } from "../../lib/locales";

interface LegalPageLayoutProps {
  title: string;
  updatedAt: string;
  children: React.ReactNode;
}

export default function LegalPageLayout({ title, updatedAt, children }: LegalPageLayoutProps) {
  const location = useLocation();
  const currentLocale = getLocaleFromPathname(location.pathname) || "ko";

  return (
    <div className="legal-page">
      <div className="legal-card">
        <a className="legal-brand" href={withLocalePath("/", currentLocale)}>
          VeriMarka
        </a>
        <h1>{title}</h1>
        <p className="legal-updated">최종 업데이트: {updatedAt}</p>
        <div className="legal-content">{children}</div>
      </div>
    </div>
  );
}
