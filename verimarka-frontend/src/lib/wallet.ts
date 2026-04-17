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

  const normalizedConnectorId = normalizeWalletConnectorId(connectorId);

  if (!connectorId) {
    return getInjectedProviders(window).length > 0;
  }

  if (normalizedConnectorId === "metaMask") {
    return Boolean(getMetaMaskProvider(window));
  }

  if (normalizedConnectorId === "rabby") {
    return Boolean(getRabbyProvider(window));
  }

  if (normalizedConnectorId === "trustWallet") {
    return Boolean(getTrustWalletProvider(window));
  }

  return getInjectedProviders(window).length > 0;
}

const connectors = [
  injected({
    target: {
      id: "metaMask",
      name: "MetaMask",
      provider(windowObject) {
        return getMetaMaskProvider(windowObject);
      },
    },
  }),
  injected({
    target: {
      id: "rabby",
      name: "Rabby",
      provider(windowObject) {
        return getRabbyProvider(windowObject);
      },
    },
  }),
  injected({
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
