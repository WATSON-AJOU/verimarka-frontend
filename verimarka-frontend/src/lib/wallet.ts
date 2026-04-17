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
  isRabby?: boolean;
  isTrust?: boolean;
  isTrustWallet?: boolean;
};

function getInjectedProviders(windowObject?: unknown): InjectedProvider[] {
  const ethereum = (windowObject as { ethereum?: InjectedProvider } | undefined)?.ethereum;

  if (!ethereum) return [];

  return Array.isArray(ethereum.providers) ? (ethereum.providers as InjectedProvider[]) : [ethereum];
}

function getMetaMaskProvider(windowObject?: unknown) {
  return getInjectedProviders(windowObject).find(
    (provider) =>
      Boolean(provider.isMetaMask) &&
      !provider.isRabby &&
      !provider.isTrust &&
      !provider.isTrustWallet,
  ) as never;
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

  if (!connectorId) {
    return getInjectedProviders(window).length > 0;
  }
  return Boolean(getProviderForConnector(connectorId, window));
}

export function logConnectorProviderSnapshot(connectorId?: string) {
  if (typeof window === "undefined") return;

  const providers = getInjectedProviders(window);
  console.info("wallet.provider.snapshot", {
    connectorId: connectorId ?? null,
    normalizedConnectorId: normalizeWalletConnectorId(connectorId) ?? null,
    hasWindowEthereum: typeof (window as Window & { ethereum?: unknown }).ethereum !== "undefined",
    providerCount: providers.length,
    providers: providers.map((provider) => ({
      isMetaMask: Boolean(provider.isMetaMask),
      isRabby: Boolean(provider.isRabby),
      isTrust: Boolean(provider.isTrust),
      isTrustWallet: Boolean(provider.isTrustWallet),
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
    target: {
      id: "metaMask",
      name: "MetaMask",
      provider(windowObject) {
        return getMetaMaskProvider(windowObject);
      },
    },
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
