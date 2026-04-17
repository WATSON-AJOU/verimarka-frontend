import { QueryClient } from "@tanstack/react-query";
import { createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

const METAMASK_CONNECTOR_IDS = new Set([
  "metaMask",
  "metaMaskSDK",
  "io.metamask",
  "io.metamask.mobile",
]);

const defaultSepoliaRpcUrl =
  import.meta.env.VITE_SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";
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

function getMetaMaskProvider(windowObject?: unknown) {
  const providers = getInjectedProviders(windowObject);
  const ethereum = (windowObject as { ethereum?: InjectedProvider } | undefined)?.ethereum;
  const metaMaskLikeProvider = providers.find((provider) => {
    if (!provider || typeof provider !== "object") return false;

    if (!provider.isMetaMask) return false;

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

  if (metaMaskLikeProvider) {
    return metaMaskLikeProvider as never;
  }

  // Some extension builds expose a single injected provider without reliable flags.
  // If there is only one provider and it does not positively identify as another wallet,
  // treat it as the requested browser wallet so connection can proceed.
  if (providers.length === 1) {
    const [provider] = providers;
    const looksLikeAnotherWallet =
      Boolean(provider?.isRabby) ||
      Boolean(provider?.isTrust) ||
      Boolean(provider?.isTrustWallet) ||
      Boolean(provider?.isCoinbaseWallet) ||
      Boolean(provider?.isPhantom);

    if (!looksLikeAnotherWallet && typeof provider?.request === "function") {
      return provider as never;
    }
  }

  if (ethereum && typeof ethereum.request === "function") {
    const looksLikeAnotherWallet =
      Boolean(ethereum.isRabby) ||
      Boolean(ethereum.isTrust) ||
      Boolean(ethereum.isTrustWallet) ||
      Boolean(ethereum.isCoinbaseWallet) ||
      Boolean(ethereum.isPhantom);

    if (!looksLikeAnotherWallet) {
      return ethereum as never;
    }
  }

  return undefined as never;
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

export function normalizeWalletConnectorId(connectorId?: string) {
  if (!connectorId) return connectorId;
  if (isMetaMaskConnectorId(connectorId)) return "metaMask";
  return connectorId;
}

export function hasConnectorProvider(connectorId?: string) {
  if (typeof window === "undefined") return false;
  const ethereum = (window as Window & { ethereum?: unknown }).ethereum;

  if (!connectorId) {
    return typeof ethereum !== "undefined" || getInjectedProviders(window).length > 0;
  }

  if (normalizeWalletConnectorId(connectorId) === "metaMask") {
    return typeof ethereum !== "undefined";
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
      hasRequest: typeof provider.request === "function",
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
    target: {
      id: "rabby",
      name: "Rabby",
      provider(windowObject) {
        return getRabbyProvider(windowObject);
      },
    },
  }),
  injected({
    unstable_shimAsyncInject: 1_500,
    target: {
      id: "trustWallet",
      name: "Trust Wallet",
      provider(windowObject) {
        return getTrustWalletProvider(windowObject);
      },
    },
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
  chains: [sepolia],
  connectors,
  transports: {
    [sepolia.id]: http(defaultSepoliaRpcUrl),
  },
});

export { METAMASK_CONNECTOR_IDS, sepolia, walletConnectEnabled };
