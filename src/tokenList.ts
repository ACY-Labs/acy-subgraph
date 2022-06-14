import { log } from '@graphprotocol/graph-ts'

export const USDC = "0x7a96316B13bD7d0529e701d2ED8b9fC4E4fd8696";
export const USDT = "0x158653b66fd72555F68eDf983736781E471639Cc";
export const WETH = "0xeBC8428DC717D440d5deCE1547456B115b868F0e";
export const WBTC = "0x05d6f705C80d9F812d9bc1A142A655CDb25e2571";
export const WMATIC = "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889";
export const ALP = "0x53a2eD45d06518f903782134aB28C0E99E3C3A13";

let tokenAddr2Symbol = new Map<string, string>();
tokenAddr2Symbol.set("0x7a96316B13bD7d0529e701d2ED8b9fC4E4fd8696".toLowerCase(), "USDC");
tokenAddr2Symbol.set("0x158653b66fd72555F68eDf983736781E471639Cc".toLowerCase(), "USDT");
tokenAddr2Symbol.set("0xeBC8428DC717D440d5deCE1547456B115b868F0e".toLowerCase(), "WETH");
tokenAddr2Symbol.set("0x05d6f705C80d9F812d9bc1A142A655CDb25e2571".toLowerCase(), "WBTC");
tokenAddr2Symbol.set("0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889".toLowerCase(), "WMATIC");
tokenAddr2Symbol.set("0x53a2eD45d06518f903782134aB28C0E99E3C3A13".toLowerCase(), "ALP");

export function getTokenSymbol(tokenAddress: string): string {
    if (tokenAddr2Symbol.has(tokenAddress)) {
        return tokenAddr2Symbol.get(tokenAddress);
    } else {
        return "UNSUPPORTED_TOKEN";
    }
}