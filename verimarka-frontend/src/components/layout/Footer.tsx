import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { getLocaleFromPathname, withLocalePath, type SupportedLocale } from "../../lib/locales";

export default function Footer() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const currentLocale = getLocaleFromPathname(location.pathname) || "ko";
  const languages = useMemo(
    () => [
      { code: "ko" as const, label: t("language.ko") },
      { code: "en" as const, label: t("language.en") },
      { code: "ja" as const, label: t("language.ja") },
      { code: "zh-CN" as const, label: t("language.zhCN") },
    ],
    [t],
  );

  function changeLanguage(language: SupportedLocale) {
    void i18n.changeLanguage(language);
    navigate(
      {
        pathname: withLocalePath(location.pathname, language),
        search: location.search,
        hash: location.hash,
      },
      { replace: true },
    );
    setLanguageMenuOpen(false);
  }

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-main">
          <div className="footer-topline">
            <h2 className="footer-logo">VeriMarka</h2>
            <div className="footer-links">
              <a href={withLocalePath("/terms", currentLocale)}>{t("footer.terms")}</a>
              <a href={withLocalePath("/privacy", currentLocale)}>{t("footer.privacy")}</a>
              <a href={withLocalePath("/support", currentLocale)}>{t("footer.support")}</a>
            </div>
          </div>

          <div className="footer-info">
            <p>{t("footer.businessInfo")}</p>
            <p>{t("footer.address")}</p>
          </div>

          <p className="footer-copy">{t("footer.copyright")}</p>
        </div>

        <div className="lang-switch lang-switch-footer">
          <button className="footer-lang" type="button" onClick={() => setLanguageMenuOpen((current) => !current)}>
            <span className="lang-button-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false">
                <path d="M12 3a9 9 0 1 0 9 9a9.01 9.01 0 0 0-9-9Zm6.92 8h-3.01a14.8 14.8 0 0 0-1.53-5.03A7.02 7.02 0 0 1 18.92 11Zm-6.92 8a12.8 12.8 0 0 1-2.05-6h4.1A12.8 12.8 0 0 1 12 19Zm-2.05-8A12.8 12.8 0 0 1 12 5a12.8 12.8 0 0 1 2.05 6Zm-4.33 2h3.01a14.8 14.8 0 0 0 1.53 5.03A7.02 7.02 0 0 1 5.62 13Zm0-2A7.02 7.02 0 0 1 10.16 5.97A14.8 14.8 0 0 0 8.63 11Zm8.22 6.03A14.8 14.8 0 0 0 15.37 13h3.01a7.02 7.02 0 0 1-4.54 4.03Z" />
              </svg>
            </span>
            {languages.find((language) => language.code === i18n.language)?.label || t("language.ko")}
            <span className="lang-caret">⌄</span>
          </button>
          {languageMenuOpen ? (
            <div className="lang-dropdown">
              {languages.map((language) => (
                <button
                  key={language.code}
                  type="button"
                  className={`lang-option ${i18n.language === language.code ? "is-active" : ""}`}
                  onClick={() => changeLanguage(language.code)}
                >
                  {language.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
