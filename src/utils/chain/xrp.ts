export function GetBlockchainTxUrl(isMainnet: boolean, hash: string): string {
  return isMainnet ? `https://livenet.xrpl.org/tx/${hash}` : `https://testnet.xrpl.org/transactions/${hash}`;
}

export function GetBlockchainAddressUrl(isMainnet: boolean, hash: string): string {
  return isMainnet ? `https://livenet.xrpl.org/accounts/${hash}` : `https://testnet.xrpl.org/accounts/${hash}`;
}
