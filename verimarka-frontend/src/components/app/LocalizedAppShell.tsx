import { QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import App from "../../App";
import { walletConfig, walletQueryClient } from "../../lib/wallet";

export default function LocalizedAppShell() {
  return (
    <WagmiProvider config={walletConfig}>
      <QueryClientProvider client={walletQueryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
