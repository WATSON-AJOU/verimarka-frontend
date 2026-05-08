import { useEffect, type ReactNode } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import i18n from "../../i18n";
import ErrorPage from "../../pages/ErrorPage";
import { getPreferredLocale, normalizeLocale, withLocalePath } from "../../lib/locales";

export function LocaleRoute({ children }: { children: ReactNode }) {
  const { locale: routeLocale } = useParams();
  const location = useLocation();
  const locale = normalizeLocale(routeLocale);

  useEffect(() => {
    if (locale && i18n.language !== locale) {
      void i18n.changeLanguage(locale);
    }
  }, [locale]);

  if (!locale) return <ErrorPage statusCode={404} />;

  if (routeLocale !== locale) {
    return (
      <Navigate
        to={{
          pathname: withLocalePath(location.pathname, locale),
          search: location.search,
          hash: location.hash,
        }}
        replace
      />
    );
  }

  return children;
}

export function LegacyRouteRedirect() {
  const location = useLocation();
  const locale = getPreferredLocale();

  return (
    <Navigate
      to={{
        pathname: withLocalePath(location.pathname, locale),
        search: location.search,
        hash: location.hash,
      }}
      replace
    />
  );
}

export function LocalizedApp({ children }: { children: ReactNode }) {
  return <LocaleRoute>{children}</LocaleRoute>;
}
