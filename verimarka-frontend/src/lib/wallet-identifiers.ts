export const METAMASK_CONNECTOR_IDS = new Set([
  "metaMask",
  "metaMaskSDK",
  "io.metamask",
  "io.metamask.mobile",
  "io.metamask.extension",
]);

export const RABBY_CONNECTOR_IDS = new Set([
  "rabby",
  "io.rabby",
]);

export const TRUST_WALLET_CONNECTOR_IDS = new Set([
  "trustWallet",
  "trustwallet",
  "trust",
  "com.trustwallet.app",
]);

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
