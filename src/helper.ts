import { BigInt, TypedMap, ethereum } from "@graphprotocol/graph-ts"
import {
  ChainlinkPrice,
} from "../generated/schema"

export const BASIS_POINTS_DIVISOR = BigInt.fromI32(10000)
export const PRECISION = BigInt.fromI32(10).pow(30)
export const PRICE_PRECISION = BigInt.fromI32(10).pow(8)


export const USDC = "0x7a96316B13bD7d0529e701d2ED8b9fC4E4fd8696";
export const USDT = "0x158653b66fd72555F68eDf983736781E471639Cc";
export const WETH = "0xeBC8428DC717D440d5deCE1547456B115b868F0e";
export const WBTC = "0x05d6f705C80d9F812d9bc1A142A655CDb25e2571";
export const WMATIC = "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889";
export const ALP = "0x53a2eD45d06518f903782134aB28C0E99E3C3A13";

export function timestampToDay(timestamp: BigInt): BigInt {
  return timestamp / BigInt.fromI32(86400) * BigInt.fromI32(86400)
}

export function timestampToPeriod(timestamp: BigInt, period: string): BigInt {
  let periodTime: BigInt

  if (period == "daily") {
    periodTime = BigInt.fromI32(86400)
  } else if (period == "hourly") {
    periodTime = BigInt.fromI32(3600)
  } else if (period == "weekly" ){
    periodTime = BigInt.fromI32(86400 * 7)
  } else {
    throw new Error("Unsupported period " + period)
  }

  return timestamp / periodTime * periodTime
}


export function getTokenDecimals(token: String): u8 {
  let tokenDecimals = new Map<String, i32>()
  tokenDecimals.set(WETH.toLowerCase(), 18)
  tokenDecimals.set(WBTC.toLowerCase(), 8)
  tokenDecimals.set(USDC.toLowerCase(), 6)
  tokenDecimals.set(USDT.toLowerCase(), 18)
  tokenDecimals.set(WMATIC.toLowerCase(), 18)
  tokenDecimals.set(ALP.toLowerCase(), 18)

  return tokenDecimals.get(token) as u8
}

export function getTokenAmountUsd(token: string, amount: BigInt): BigInt {
  let decimals = getTokenDecimals(token)
  let denominator = BigInt.fromI32(10).pow(decimals)
  let price = getTokenPrice(token)
  return amount * price / denominator
}

export function getTokenAmountUsdWithPrice(token: string, amount: BigInt, price: BigInt): BigInt {
  let decimals = getTokenDecimals(token.toLowerCase())
  let denominator = BigInt.fromI32(10).pow(decimals)
  // let price = getTokenPrice(token)
  return amount * adjustPrice(price) / denominator
}

function adjustPrice(price: BigInt): BigInt {
  return price * BigInt.fromI32(10).pow(22)
}

export function getTokenPrice(token: string): BigInt {
  let chainlinkPriceEntity = ChainlinkPrice.load(token)
  if (chainlinkPriceEntity != null) {
    // all chainlink prices have 8 decimals
    // adjusting them to fit GMX 30 decimals USD values
    return chainlinkPriceEntity.value * BigInt.fromI32(10).pow(22)
  }


  let prices = new TypedMap<String, BigInt>()
  prices.set(WETH.toLowerCase(), BigInt.fromI32(3350) * PRECISION)
  prices.set(WBTC.toLowerCase(), BigInt.fromI32(45000) * PRECISION)
  prices.set(USDC.toLowerCase(), PRECISION)
  prices.set(USDT.toLowerCase(), PRECISION)
  prices.set(WMATIC.toLowerCase(), PRECISION)
  prices.set(ALP.toLowerCase(), PRECISION)

  return prices.get(token) as BigInt
}

export function getIdFromEvent(event: ethereum.Event): string {
  return event.transaction.hash.toHexString() + ':' + event.logIndex.toString()
}

export function getWeekId(timestamp: BigInt): string {
  let day = 86400
  let week = day * 7
  let weekTimestamp = timestamp.toI32() / week * week - 3 * day
  return weekTimestamp.toString()
}

export function getDayId(timestamp: BigInt): string {
  let dayTimestamp = timestamp.toI32() / 86400 * 86400
  return dayTimestamp.toString()
}

export function getHourId(timestamp: BigInt): string {
  let hourTimestamp = timestamp.toI32() / 3600 * 3600
  return hourTimestamp.toString()
}

export const TRADE_TYPES = new Array<string>(5)
TRADE_TYPES[0] = "margin"
TRADE_TYPES[1] = "swap"
TRADE_TYPES[2] = "mint"
TRADE_TYPES[3] = "burn"
TRADE_TYPES[4] = "liquidation"
TRADE_TYPES[5] = "marginAndLiquidation"

export const ZERO = BigInt.fromI32(0)
export const FUNDING_PRECISION = BigInt.fromI32(1000000)
