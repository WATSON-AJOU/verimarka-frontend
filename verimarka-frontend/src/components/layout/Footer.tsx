import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t, i18n } = useTranslation();
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const languages = useMemo(
    () => [
      { code: "ko", label: t("language.ko") },
      { code: "en", label: t("language.en") },
      { code: "ja", label: t("language.ja") },
      { code: "zh-CN", label: t("language.zhCN") },
    ],
    [t],
  );

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-main">
          <div className="footer-topline">
            <h2 className="footer-logo">VeriMarka</h2>
            <div className="footer-links">
              <a href="/terms">{t("footer.terms")}</a>
              <a href="/privacy">{t("footer.privacy")}</a>
              <a href="/support">{t("footer.support")}</a>
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
                  onClick={() => {
                    void i18n.changeLanguage(language.code);
                    setLanguageMenuOpen(false);
                  }}
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
