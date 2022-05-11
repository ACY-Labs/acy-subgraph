import { log } from '@graphprotocol/graph-ts'
// interface dict {
//     [key: string]: string;
// }

// const tokenAddr2Symbol: dict = {
//     "0x7a96316B13bD7d0529e701d2ED8b9fC4E4fd8696" : "USDC",
//     "0x158653b66fd72555F68eDf983736781E471639Cc" : "USDT",
//     "0xeBC8428DC717D440d5deCE1547456B115b868F0e" : "WETH",
//     "0x05d6f705C80d9F812d9bc1A142A655CDb25e2571" : "WBTC",
//     "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889" : "WMATIC"
// }

let tokenAddr2Symbol = new Map<string, string>();
tokenAddr2Symbol.set("0x7a96316B13bD7d0529e701d2ED8b9fC4E4fd8696".toLowerCase(), "USDC");
tokenAddr2Symbol.set("0x158653b66fd72555F68eDf983736781E471639Cc".toLowerCase(), "USDT");
tokenAddr2Symbol.set("0xeBC8428DC717D440d5deCE1547456B115b868F0e".toLowerCase(), "WETH");
tokenAddr2Symbol.set("0x05d6f705C80d9F812d9bc1A142A655CDb25e2571".toLowerCase(), "WBTC");
tokenAddr2Symbol.set("0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889".toLowerCase(), "WMATIC");

export function getTokenSymbol(tokenAddress: string): string {
    if (tokenAddr2Symbol.has(tokenAddress)) {
        return tokenAddr2Symbol.get(tokenAddress);
    } else {
        return "UNSUPPORTED_TOKEN";
    }
}