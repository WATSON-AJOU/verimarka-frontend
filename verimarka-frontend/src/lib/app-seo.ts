import type { TabName } from "../types/app";

export function getLocalizedSeoCopy(language: string, tab: TabName) {
  const normalizedLanguage = language.toLowerCase();
  const locale = normalizedLanguage === "en"
    ? "en-US"
    : normalizedLanguage === "ja"
      ? "ja-JP"
      : normalizedLanguage === "zh-cn"
        ? "zh-CN"
        : "ko-KR";

  const dictionary = normalizedLanguage === "en"
    ? {
        home: {
          title: "Blockchain copyright proof and verification",
          description: "VeriMarka helps creators register, watermark, verify, and track copyright evidence on blockchain with a practical workflow.",
        },
        add: {
          title: "Register original content",
          description: "Upload an image, run similarity analysis, add a watermark, and issue blockchain proof for your original work.",
        },
        verify: {
          title: "Verify content authenticity",
          description: "Check whether uploaded content has watermark evidence and blockchain registration history in VeriMarka.",
        },
        history: {
          title: "Analysis and verification history",
          description: "Review ALLOW, BLOCK, REVIEW, and verification history in one place with blockchain evidence and voting status.",
        },
        mypage: {
          title: "Account and wallet dashboard",
          description: "Manage your profile, verification status, connected wallet, and NFT-based voting eligibility in VeriMarka.",
        },
      }
    : normalizedLanguage === "ja"
      ? {
          home: {
            title: "ブロックチェーン著作権証明と検証",
            description: "VeriMarka は、クリエイター向けに登録、ウォーターマーク、検証、ブロックチェーン証跡管理を一つの流れで提供します。",
          },
          add: {
            title: "オリジナル作品を登録",
            description: "画像をアップロードし、類似度分析、ウォーターマーク挿入、ブロックチェーン証明の発行まで進められます。",
          },
          verify: {
            title: "作品の真正性を検証",
            description: "アップロードしたコンテンツにウォーターマーク証跡とブロックチェーン登録履歴があるか確認できます。",
          },
          history: {
            title: "分析・検証履歴",
            description: "ALLOW、BLOCK、REVIEW、検証履歴をブロックチェーン情報と一緒にまとめて確認できます。",
          },
          mypage: {
            title: "アカウントとウォレット管理",
            description: "プロフィール、認証状態、接続ウォレット、NFT ベースの投票資格を管理できます。",
          },
        }
      : normalizedLanguage === "zh-cn"
        ? {
            home: {
              title: "区块链版权存证与验证",
              description: "VeriMarka 为创作者提供内容登记、水印嵌入、真伪验证与区块链证据管理的一体化流程。",
            },
            add: {
              title: "登记原创内容",
              description: "上传图片后即可进行相似度分析、水印写入，并生成区块链版权存证。",
            },
            verify: {
              title: "验证内容真实性",
              description: "检查上传内容是否包含 VeriMarka 水印证据以及区块链登记记录。",
            },
            history: {
              title: "分析与验证记录",
              description: "在一个页面查看 ALLOW、BLOCK、REVIEW 和验证记录及其链上信息。",
            },
            mypage: {
              title: "账户与钱包面板",
              description: "管理个人资料、认证状态、已连接钱包以及基于 NFT 的投票资格。",
            },
          }
        : {
            home: {
              title: "블록체인 저작권 증명 및 검증",
              description: "VeriMarka는 창작자가 이미지 등록, 워터마크 삽입, 검증, 블록체인 증빙 추적까지 한 번에 처리할 수 있게 돕습니다.",
            },
            add: {
              title: "원본 저작물 등록",
              description: "이미지를 업로드해 유사도 분석, 워터마크 삽입, 블록체인 발행까지 진행하고 저작권 증빙을 남기세요.",
            },
            verify: {
              title: "저작물 진위 검증",
              description: "업로드한 콘텐츠에 Verimarka 워터마크와 블록체인 등록 이력이 있는지 확인할 수 있습니다.",
            },
            history: {
              title: "분석 및 검증 기록",
              description: "ALLOW, BLOCK, REVIEW, 저작물 검증 기록을 블록체인 정보와 함께 한 곳에서 확인하세요.",
            },
            mypage: {
              title: "계정 및 지갑 대시보드",
              description: "프로필, 인증 상태, 연결된 지갑, NFT 기반 투표 자격까지 Verimarka에서 관리할 수 있습니다.",
            },
          };

  return {
    locale,
    ...dictionary[tab],
  };
}
