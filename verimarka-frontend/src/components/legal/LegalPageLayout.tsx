interface LegalPageLayoutProps {
  title: string;
  updatedAt: string;
  children: React.ReactNode;
}

export default function LegalPageLayout({ title, updatedAt, children }: LegalPageLayoutProps) {
  return (
    <div className="legal-page">
      <div className="legal-card">
        <a className="legal-brand" href="/">
          VeriMarka
        </a>
        <h1>{title}</h1>
        <p className="legal-updated">최종 업데이트: {updatedAt}</p>
        <div className="legal-content">{children}</div>
      </div>
    </div>
  );
}
