interface FilePreviewProps {
  src: string | null;
  alt: string;
  mimeType: string;
  fallbackLabel: string;
}

function isImageMimeType(mimeType: string | null | undefined) {
  return (mimeType || "").startsWith("image/");
}

function isPdfMimeType(mimeType: string | null | undefined, fileName = "") {
  return (mimeType || "").toLowerCase() === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
}

function buildPdfPreviewSrc(src: string) {
  const [base] = src.split("#");
  return `${base}#page=1&toolbar=0&navpanes=0&scrollbar=0&view=Fit`;
}

export default function FilePreview({ src, alt, mimeType, fallbackLabel }: FilePreviewProps) {
  if (src && (isImageMimeType(mimeType) || mimeType === "preview-image")) {
    return <img src={src} alt={alt} />;
  }

  if (src && isPdfMimeType(mimeType, alt)) {
    return (
      <object
        className="file-preview-pdf"
        data={buildPdfPreviewSrc(src)}
        type="application/pdf"
        aria-label={`${alt} 첫 페이지 미리보기`}
      >
        <div className="verify-placeholder-frame">{fallbackLabel}</div>
      </object>
    );
  }

  return <div className="verify-placeholder-frame">{fallbackLabel}</div>;
}
