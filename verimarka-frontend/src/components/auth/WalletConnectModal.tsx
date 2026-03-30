import type { Connector } from "wagmi";

interface WalletConnectModalProps {
  open: boolean;
  connectors: Connector[];
  walletConnectEnabled: boolean;
  connecting: boolean;
  connectingLabel?: string;
  onClose: () => void;
  onSelectConnector: (connector: Connector) => void;
}

function getConnectorDescription(connector: Connector) {
  if (connector.id === "metaMask") {
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
                    {connector.id === "metaMask"
                      ? "MetaMask"
                      : connector.id === "rabby"
                        ? "Rabby"
                        : connector.id === "trustWallet"
                          ? "Trust Wallet"
                        : connector.name}
                  </strong>
                  <span>
                    {connector.id === "walletConnect"
                      ? "WalletConnect"
                      : connector.id === "rabby" || connector.id === "trustWallet"
                        ? "Injected"
                        : "Injected"}
                  </span>
                </div>
                <p>{getConnectorDescription(connector)}</p>
                {connector.id === "walletConnect" && !walletConnectEnabled ? (
                  <small>VITE_WALLETCONNECT_PROJECT_ID 설정 후 사용할 수 있습니다.</small>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
