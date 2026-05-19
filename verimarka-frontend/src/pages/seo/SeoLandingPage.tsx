import type { SupportedLocale } from "../../lib/locales";
import { withLocalePath } from "../../lib/locales";

type SeoLandingKind = "home" | "register" | "verify";

interface SeoLandingPageProps {
  kind: SeoLandingKind;
  locale: SupportedLocale;
}

const copy = {
  ko: {
    home: {
      title: "VeriMarka 블록체인 저작권 증명 및 검증",
      intro: "VeriMarka는 이미지와 문서 기반 저작물을 등록하고, 워터마크를 삽입하며, 블록체인 기록으로 검증 이력을 남기는 디지털 자산 신뢰 서비스입니다.",
      sections: [
        {
          title: "서비스 핵심 기능",
          body: "창작자는 원본 저작물을 업로드해 유사도 분석을 받고, 등록 가능한 콘텐츠에는 워터마크와 블록체인 증빙을 연결할 수 있습니다.",
        },
        {
          title: "검색과 AI가 이해하기 쉬운 저작물 검증 흐름",
          body: "등록, 검증, 분석 기록, 지갑 연동, 거래 해시 확인을 하나의 흐름으로 제공해 저작물의 출처와 처리 결과를 추적할 수 있습니다.",
        },
      ],
      faqs: [
        ["VeriMarka는 어떤 서비스인가요?", "이미지와 문서 저작물의 등록, 워터마크 삽입, 블록체인 증빙, 진위 검증을 지원하는 서비스입니다."],
        ["블록체인 기록은 왜 사용하나요?", "등록과 발행 이력을 변경하기 어려운 형태로 남겨 이후 검증과 추적에 참고할 수 있게 하기 위해 사용합니다."],
      ],
    },
    register: {
      title: "원본 저작물 등록",
      intro: "VeriMarka 저작물 등록은 원본 이미지 또는 문서를 업로드한 뒤 유사도 분석, 워터마크 삽입, 블록체인 발행 준비까지 이어지는 절차입니다.",
      sections: [
        {
          title: "등록 절차",
          body: "파일 업로드 후 유사 콘텐츠 여부를 확인하고, 등록 가능한 결과에는 워터마크를 삽입한 뒤 토큰 정보와 거래 해시를 확인합니다.",
        },
        {
          title: "등록 전 확인할 사항",
          body: "이용자는 업로드하는 콘텐츠에 필요한 권리를 보유해야 하며, 개인정보나 제3자 권리를 침해하는 자료를 포함하지 않아야 합니다.",
        },
      ],
      faqs: [
        ["어떤 파일을 등록할 수 있나요?", "JPG, PNG 이미지와 PDF, DOC, DOCX 문서 형식을 지원하도록 설계되어 있습니다."],
        ["등록 결과가 법적 소유권을 보장하나요?", "아니요. 등록 결과는 기술적 증빙과 참고 정보이며 법적 소유권 판단을 보장하지 않습니다."],
      ],
    },
    verify: {
      title: "저작물 진위 검증",
      intro: "VeriMarka 검증은 업로드한 콘텐츠에서 워터마크 증거, 등록 이력, 블록체인 발행 정보를 확인해 저작물의 출처 추적을 돕습니다.",
      sections: [
        {
          title: "검증 절차",
          body: "검증할 파일을 업로드하면 워터마크 검출을 시도하고, 필요한 경우 등록 이력과 유사 후보 정보를 함께 확인합니다.",
        },
        {
          title: "검증 결과의 활용",
          body: "검증 결과는 원본성 검토, 내부 심사, 저작권 관리, 콘텐츠 유통 전 확인 절차에 참고할 수 있습니다.",
        },
      ],
      faqs: [
        ["워터마크가 없으면 검증이 불가능한가요?", "워터마크 검출이 실패해도 등록 이력 또는 유사 후보 분석을 통해 참고 정보를 확인할 수 있습니다."],
        ["검증 결과를 어디에 활용할 수 있나요?", "콘텐츠 출처 확인, 권리 관리, 분쟁 전 사전 검토, 내부 심사 자료로 활용할 수 있습니다."],
      ],
    },
  },
  en: {
    home: {
      title: "VeriMarka blockchain copyright proof and verification",
      intro: "VeriMarka helps creators register image and document-based works, insert watermarks, and keep verification records with blockchain evidence.",
      sections: [
        { title: "Core service", body: "Creators can upload original works, run similarity analysis, and connect approved content with watermark and blockchain proof." },
        { title: "Traceable verification workflow", body: "Registration, verification, history review, wallet connection, and transaction hash checks are provided in one workflow." },
      ],
      faqs: [
        ["What is VeriMarka?", "VeriMarka supports copyright registration, watermark insertion, blockchain proof, and authenticity verification for creative works."],
        ["Why use blockchain records?", "Blockchain records help preserve registration and issuance evidence in a format that is difficult to alter."],
      ],
    },
    register: {
      title: "Register original content",
      intro: "VeriMarka registration guides creators from file upload through similarity analysis, watermark insertion, and blockchain issuance preparation.",
      sections: [
        { title: "Registration workflow", body: "Upload a file, review similarity results, insert a watermark for approved content, and check token or transaction information." },
        { title: "Before registering", body: "Users should hold the necessary rights to uploaded content and avoid including private data or third-party infringing material." },
      ],
      faqs: [
        ["Which files are supported?", "The service is designed to support JPG, PNG, PDF, DOC, and DOCX files."],
        ["Does registration prove legal ownership?", "No. The result is technical evidence and reference information, not a legal ownership ruling."],
      ],
    },
    verify: {
      title: "Verify content authenticity",
      intro: "VeriMarka verification checks watermark evidence, registration history, and blockchain issuance information to help trace content origin.",
      sections: [
        { title: "Verification workflow", body: "Upload a file to detect watermark evidence and review related registration records or similar candidates." },
        { title: "How results are used", body: "Verification results can support origin checks, internal review, copyright management, and pre-distribution screening." },
      ],
      faqs: [
        ["Can content be verified without a watermark?", "If watermark detection fails, related registration records or similar candidate analysis may still provide reference information."],
        ["Where can verification results be used?", "They can support content origin review, rights management, pre-dispute checks, and internal screening."],
      ],
    },
  },
  ja: {
    home: {
      title: "VeriMarka ブロックチェーン著作権証明と検証",
      intro: "VeriMarka は、画像や文書ベースの作品登録、ウォーターマーク挿入、ブロックチェーン証跡による検証履歴管理を支援します。",
      sections: [
        { title: "主な機能", body: "クリエイターは原本作品をアップロードし、類似度分析を行い、承認されたコンテンツにウォーターマークとブロックチェーン証跡を連携できます。" },
        { title: "追跡可能な検証フロー", body: "登録、検証、履歴確認、ウォレット連携、取引ハッシュ確認を一つの流れで提供します。" },
      ],
      faqs: [
        ["VeriMarka とは何ですか？", "作品の登録、ウォーターマーク挿入、ブロックチェーン証明、真正性検証を支援するサービスです。"],
        ["なぜブロックチェーン記録を使いますか？", "登録と発行履歴を改ざんしにくい形で残し、後日の検証に使うためです。"],
      ],
    },
    register: {
      title: "オリジナル作品を登録",
      intro: "VeriMarka の登録機能は、ファイルアップロードから類似度分析、ウォーターマーク挿入、ブロックチェーン発行準備までを案内します。",
      sections: [
        { title: "登録手順", body: "ファイルをアップロードし、類似度結果を確認し、承認されたコンテンツにウォーターマークを挿入して取引情報を確認します。" },
        { title: "登録前の確認", body: "利用者はアップロードするコンテンツに必要な権利を持ち、個人情報や第三者の権利侵害資料を含めない必要があります。" },
      ],
      faqs: [
        ["対応ファイルは何ですか？", "JPG、PNG、PDF、DOC、DOCX をサポートする設計です。"],
        ["登録は法的所有権を保証しますか？", "いいえ。登録結果は技術的証跡と参考情報であり、法的判断を保証するものではありません。"],
      ],
    },
    verify: {
      title: "作品の真正性を検証",
      intro: "VeriMarka の検証は、ウォーターマーク証跡、登録履歴、ブロックチェーン発行情報を確認し、作品の出所追跡を支援します。",
      sections: [
        { title: "検証手順", body: "検証するファイルをアップロードし、ウォーターマーク検出、登録履歴、類似候補情報を確認します。" },
        { title: "検証結果の活用", body: "出所確認、社内審査、著作権管理、配信前チェックの参考情報として利用できます。" },
      ],
      faqs: [
        ["ウォーターマークがない場合も検証できますか？", "検出できない場合でも、登録履歴や類似候補分析から参考情報を得られることがあります。"],
        ["検証結果は何に使えますか？", "出所確認、権利管理、紛争前確認、内部審査に活用できます。"],
      ],
    },
  },
  "zh-CN": {
    home: {
      title: "VeriMarka 区块链版权存证与验证",
      intro: "VeriMarka 帮助创作者登记图片和文档作品，嵌入水印，并通过区块链证据保留验证记录。",
      sections: [
        { title: "核心服务", body: "创作者可以上传原创作品，进行相似度分析，并为通过审核的内容连接水印与区块链证明。" },
        { title: "可追踪的验证流程", body: "登记、验证、历史记录、钱包连接和交易哈希查询整合在同一流程中。" },
      ],
      faqs: [
        ["VeriMarka 是什么？", "VeriMarka 支持作品登记、水印嵌入、区块链存证和真实性验证。"],
        ["为什么使用区块链记录？", "区块链记录可以以较难篡改的方式保存登记和发行证据，便于后续验证。"],
      ],
    },
    register: {
      title: "登记原创内容",
      intro: "VeriMarka 登记流程覆盖文件上传、相似度分析、水印嵌入和区块链发行准备。",
      sections: [
        { title: "登记流程", body: "上传文件后查看相似度结果，为通过审核的内容嵌入水印，并确认代币或交易信息。" },
        { title: "登记前确认", body: "用户应拥有上传内容所需权利，并避免包含个人信息或侵犯第三方权利的材料。" },
      ],
      faqs: [
        ["支持哪些文件？", "服务设计支持 JPG、PNG、PDF、DOC 和 DOCX 文件。"],
        ["登记是否证明法律所有权？", "不是。登记结果是技术证据和参考信息，不构成法律所有权判断。"],
      ],
    },
    verify: {
      title: "验证内容真实性",
      intro: "VeriMarka 验证会检查水印证据、登记历史和区块链发行信息，帮助追踪内容来源。",
      sections: [
        { title: "验证流程", body: "上传待验证文件后，系统会尝试检测水印，并查看相关登记记录或相似候选信息。" },
        { title: "验证结果用途", body: "验证结果可用于来源确认、内部审核、版权管理和发布前检查。" },
      ],
      faqs: [
        ["没有水印还能验证吗？", "即使水印检测失败，也可能通过登记记录或相似候选分析获得参考信息。"],
        ["验证结果可用于哪里？", "可用于内容来源审查、权利管理、争议前检查和内部审核。"],
      ],
    },
  },
} satisfies Record<SupportedLocale, Record<SeoLandingKind, {
  title: string;
  intro: string;
  sections: Array<{ title: string; body: string }>;
  faqs: Array<[string, string]>;
}>>;

export default function SeoLandingPage({ kind, locale }: SeoLandingPageProps) {
  const page = copy[locale][kind];
  const homePath = withLocalePath("/", locale);
  const registerPath = withLocalePath("/register", locale);
  const verifyPath = withLocalePath("/verify", locale);
  const supportPath = withLocalePath("/support", locale);

  return (
    <main className="legal-page">
      <article className="legal-card">
        <a className="legal-brand" href={homePath}>VeriMarka</a>
        <h1>{page.title}</h1>
        <p>{page.intro}</p>

        {page.sections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            <p>{section.body}</p>
          </section>
        ))}

        <section>
          <h2>FAQ</h2>
          {page.faqs.map(([question, answer]) => (
            <div key={question}>
              <h3>{question}</h3>
              <p>{answer}</p>
            </div>
          ))}
        </section>

        <section>
          <h2>VeriMarka links</h2>
          <ul>
            <li><a href={homePath}>Home</a></li>
            <li><a href={registerPath}>Register content</a></li>
            <li><a href={verifyPath}>Verify content</a></li>
            <li><a href={supportPath}>Support and FAQ</a></li>
          </ul>
        </section>
      </article>
    </main>
  );
}
