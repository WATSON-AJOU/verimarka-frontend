import { QueryClient } from "@tanstack/react-query";
import { createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

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

function getTrustWalletProvider(windowObject?: unknown) {
  const ethereum = (windowObject as {
    ethereum?: {
      providers?: Array<Record<string, unknown>>;
      isTrust?: boolean;
      isTrustWallet?: boolean;
    };
  } | undefined)?.ethereum;

  if (!ethereum) return undefined;

  const providers = Array.isArray(ethereum.providers) ? ethereum.providers : [ethereum];
  return providers.find(
    (provider) =>
      Boolean(
        (provider as { isTrust?: boolean; isTrustWallet?: boolean }).isTrust ||
          (provider as { isTrust?: boolean; isTrustWallet?: boolean }).isTrustWallet,
      ),
  ) as never;
}

const connectors = [
  injected({
    target: "metaMask",
  }),
  injected({
    target: "rabby",
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

export { sepolia, walletConnectEnabled };
