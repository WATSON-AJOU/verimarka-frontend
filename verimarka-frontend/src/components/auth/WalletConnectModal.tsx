import type { Connector } from "wagmi";
import { isMetaMaskConnectorId } from "../../lib/wallet";

interface WalletConnectModalProps {
  open: boolean;
  connectors: Connector[];
  walletConnectEnabled: boolean;
  connecting: boolean;
  connectingLabel?: string;
  onClose: () => void;
  onSelectConnector: (connector: Connector) => void;
}

function getConnectorKind(connector: Connector) {
  if (connector.id === "walletConnect") return "QR 연결";
  return "브라우저 확장";
}

function getConnectorDescription(connector: Connector) {
  if (isMetaMaskConnectorId(connector.id)) {
    return "브라우저 MetaMask 확장 프로그램으로 연결합니다.";
  }

  if (connector.id === "rabby") {
    return "브라우저 Rabby 지갑 확장 프로그램으로 연결합니다.";
  }

  if (connector.id === "trustWallet") {
    return "브라우저 Trust Wallet 확장 프로그램으로 연결합니다.";
  }

  if (connector.id === "walletConnect") {
    return "모바일 지갑 또는 외부 지갑 앱을 QR로 연결합니다.";
  }

  return "브라우저 지갑으로 연결합니다.";
}

export default function WalletConnectModal({
  open,
  connectors,
  walletConnectEnabled,
  connecting,
  connectingLabel,
  onClose,
  onSelectConnector,
}: WalletConnectModalProps) {
  if (!open) return null;

  return (
    <div className="modalOverlay">
      <div className="modalCard walletConnectCard" onClick={(event) => event.stopPropagation()}>
        <button className="modalClose" type="button" onClick={onClose}>
          닫기
        </button>

        <div className="walletConnectBadge">WALLET</div>
        <h2 className="authTitle">지갑 연결</h2>
        <p className="authHint authHint--center">
          연결할 지갑 방식을 선택하고, 지갑에서 서명을 완료하세요.
        </p>
        <div className="walletConnectGuide">
          <strong>연결 안내</strong>
          <p>
            데스크톱에서는 확장 지갑 또는 QR 연결을 사용할 수 있습니다. QR 연결을 선택하면 모바일 지갑 앱에서
            스캔하여 같은 계정으로 이어서 승인할 수 있습니다.
          </p>
          <ul>
            <li>브라우저 지갑: MetaMask, Rabby, Trust Wallet 확장 프로그램으로 바로 연결</li>
            <li>QR 연결: 모바일 지갑 앱에서 QR을 스캔한 뒤 앱에서 승인</li>
          </ul>
          <span className={`walletConnectStatus ${walletConnectEnabled ? "is-ready" : "is-disabled"}`}>
            {walletConnectEnabled
              ? "WalletConnect QR 연결 사용 가능"
              : "WalletConnect QR 연결은 아직 비활성화되어 있습니다. projectId 설정이 필요합니다."}
          </span>
        </div>
        {connecting ? (
          <p className="authHint authHint--center">
            {connectingLabel || "지갑 승인창을 확인하고 서명을 완료하세요."}
          </p>
        ) : null}

        <div className="walletConnectorList">
          {connectors.map((connector) => {
            const disabled = connecting || (connector.id === "walletConnect" && !walletConnectEnabled);
            return (
              <button
                key={connector.uid}
                className="walletConnectorButton"
                type="button"
                disabled={disabled}
                onClick={() => onSelectConnector(connector)}
              >
                <div className="walletConnectorHeader">
                    <strong>
                    {isMetaMaskConnectorId(connector.id)
                      ? "MetaMask"
                      : connector.id === "rabby"
                        ? "Rabby"
                        : connector.id === "trustWallet"
                          ? "Trust Wallet"
                        : connector.name}
                  </strong>
                  <span>{getConnectorKind(connector)}</span>
                </div>
                <p>{getConnectorDescription(connector)}</p>
                {connector.id === "walletConnect" && walletConnectEnabled ? (
                  <small className="walletConnectReadyText">
                    선택 시 WalletConnect 모달이 열리고, QR 코드를 모바일 지갑 앱으로 스캔할 수 있습니다.
                  </small>
                ) : null}
                {connector.id === "walletConnect" && !walletConnectEnabled ? (
                  <small>배포 환경의 `VITE_WALLETCONNECT_PROJECT_ID` 설정 후 사용할 수 있습니다.</small>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
