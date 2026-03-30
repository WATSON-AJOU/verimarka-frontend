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

const connectors = [
  injected({
    target: "metaMask",
  }),
  injected({
    target: "rabby",
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
