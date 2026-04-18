import { QueryClient } from "@tanstack/react-query";
import { createConfig, http } from "wagmi";
import { polygon } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

const METAMASK_CONNECTOR_IDS = new Set([
  "metaMask",
  "metaMaskSDK",
  "io.metamask",
  "io.metamask.mobile",
  "io.metamask.extension",
]);

const RABBY_CONNECTOR_IDS = new Set([
  "rabby",
  "io.rabby",
]);

const TRUST_WALLET_CONNECTOR_IDS = new Set([
  "trustWallet",
  "trustwallet",
  "trust",
  "com.trustwallet.app",
]);

const defaultPolygonRpcUrl =
  import.meta.env.VITE_POLYGON_RPC_URL || "https://polygon-rpc.com";
export const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "";
const walletConnectEnabled = walletConnectProjectId.trim().length > 0;

export const walletQueryClient = new QueryClient();

const walletConnectMetadata = {
  name: "VeriMarka",
  description: "VeriMarka wallet connection",
  url: typeof window !== "undefined" ? window.location.origin : "https://verimarka.com",
  icons: ["https://verimarka.com/favicon.ico"],
};

type InjectedProvider = {
  providers?: Array<Record<string, unknown>>;
  isMetaMask?: boolean;
  isBraveWallet?: boolean;
  isRabby?: boolean;
  isTrust?: boolean;
  isTrustWallet?: boolean;
  _events?: unknown;
  _state?: unknown;
  [key: string]: unknown;
};

function getInjectedProviders(windowObject?: unknown): InjectedProvider[] {
  const ethereum = (windowObject as { ethereum?: InjectedProvider } | undefined)?.ethereum;

  if (!ethereum) return [];

  return Array.isArray(ethereum.providers) ? (ethereum.providers as InjectedProvider[]) : [ethereum];
}

function hasConnectorRequest(provider: InjectedProvider | undefined) {
  return Boolean(provider && typeof provider.request === "function");
}

function getMetaMaskProvider(windowObject?: unknown) {
  const providers = getInjectedProviders(windowObject);
  const metaMaskProvider = providers.find((provider) => {
    if (!provider || typeof provider !== "object") return false;

    if (!provider.isMetaMask) return false;
    if (typeof provider.request !== "function") return false;

    // Mirror wagmi's built-in exclusions for wallets that impersonate MetaMask.
    if (provider.isBraveWallet && !provider._events && !provider._state) return false;

    const conflictingFlags = [
      "isApexWallet",
      "isAvalanche",
      "isBitKeep",
      "isBlockWallet",
      "isKuCoinWallet",
      "isMathWallet",
      "isOkxWallet",
      "isOKExWallet",
      "isOneInchIOSWallet",
      "isOneInchAndroidWallet",
      "isOpera",
      "isPhantom",
      "isPortal",
      "isRabby",
      "isTokenPocket",
      "isTokenary",
      "isUniswapWallet",
      "isZerion",
      "isTrust",
      "isTrustWallet",
    ];

    return conflictingFlags.every((flag) => !provider[flag]);
  });

  return metaMaskProvider as never;
}

function getRabbyProvider(windowObject?: unknown) {
  return getInjectedProviders(windowObject).find((provider) => Boolean(provider.isRabby)) as never;
}

function getTrustWalletProvider(windowObject?: unknown) {
  return getInjectedProviders(windowObject).find(
    (provider) => Boolean(provider.isTrust || provider.isTrustWallet),
  ) as never;
}

function getProviderForConnector(connectorId?: string, windowObject?: unknown) {
  const normalizedConnectorId = normalizeWalletConnectorId(connectorId);

  if (normalizedConnectorId === "metaMask") {
    return getMetaMaskProvider(windowObject);
  }

  if (normalizedConnectorId === "rabby") {
    return getRabbyProvider(windowObject);
  }

  if (normalizedConnectorId === "trustWallet") {
    return getTrustWalletProvider(windowObject);
  }

  return getInjectedProviders(windowObject)[0];
}

export function isMetaMaskConnectorId(connectorId?: string) {
  return Boolean(connectorId && METAMASK_CONNECTOR_IDS.has(connectorId));
}

export function isRabbyConnectorId(connectorId?: string) {
  return Boolean(connectorId && RABBY_CONNECTOR_IDS.has(connectorId));
}

export function isTrustWalletConnectorId(connectorId?: string) {
  return Boolean(connectorId && TRUST_WALLET_CONNECTOR_IDS.has(connectorId));
}

export function normalizeWalletConnectorId(connectorId?: string) {
  if (!connectorId) return connectorId;
  if (isMetaMaskConnectorId(connectorId)) return "metaMask";
  if (isRabbyConnectorId(connectorId)) return "rabby";
  if (isTrustWalletConnectorId(connectorId)) return "trustWallet";
  return connectorId;
}

export function hasConnectorProvider(connectorId?: string) {
  if (typeof window === "undefined") return false;

  if (!connectorId) {
    return getInjectedProviders(window).length > 0;
  }

  return Boolean(getProviderForConnector(connectorId, window));
}

export function logConnectorProviderSnapshot(connectorId?: string) {
  if (typeof window === "undefined") return;

  const providers = getInjectedProviders(window);
  const ethereum = (window as Window & { ethereum?: { request?: unknown } }).ethereum;
  console.info("wallet.provider.snapshot", {
    connectorId: connectorId ?? null,
    normalizedConnectorId: normalizeWalletConnectorId(connectorId) ?? null,
    hasWindowEthereum: typeof ethereum !== "undefined",
    hasWindowEthereumRequest: typeof ethereum?.request === "function",
    providerCount: providers.length,
    providers: providers.map((provider) => ({
      isMetaMask: Boolean(provider.isMetaMask),
      isRabby: Boolean(provider.isRabby),
      isTrust: Boolean(provider.isTrust),
      isTrustWallet: Boolean(provider.isTrustWallet),
      hasRequest: hasConnectorRequest(provider),
    })),
    matchedProvider: Boolean(getProviderForConnector(connectorId, window)),
  });
}

export async function waitForConnectorProvider(connectorId?: string, timeoutMs = 1500, intervalMs = 100) {
  if (typeof window === "undefined") return false;

  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (hasConnectorProvider(connectorId)) {
      return true;
    }
    await new Promise((resolve) => window.setTimeout(resolve, intervalMs));
  }

  return hasConnectorProvider(connectorId);
}

const connectors = [
  injected({
    unstable_shimAsyncInject: 1_500,
    target: "metaMask",
  }),
  injected({
    unstable_shimAsyncInject: 1_500,
    target: "rabby",
  }),
  injected({
    unstable_shimAsyncInject: 1_500,
    target: "trustWallet",
  }),
  ...(walletConnectEnabled
    ? [
        walletConnect({
          projectId: walletConnectProjectId,
          metadata: walletConnectMetadata,
          showQrModal: true,
        }),
      ]
    : []),
];

export const walletConfig = createConfig({
  chains: [polygon],
  connectors,
  transports: {
    [polygon.id]: http(defaultPolygonRpcUrl),
  },
});

export { METAMASK_CONNECTOR_IDS, polygon as walletChain, walletConnectEnabled };
