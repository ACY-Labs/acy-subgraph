import { BigInt } from "@graphprotocol/graph-ts"
// the abis and events are same for all tokens, so importing any of them is enough
import { AnswerUpdated as AnswerUpdatedEvent } from "../generated/ChainlinkAggregatorBTC/ChainlinkAggregator"

import { ChainlinkPrice, TokenStat, AlpStat } from "../generated/schema"
import {USDC, USDT, WETH, WBTC, WMATIC, ALP} from "./tokenList"
import { ZERO, getTokenAmountUsdWithPrice } from "./helper"

function _storeChainlinkPrice(token: string, value: BigInt, timestamp: BigInt): void {
    let id = token + ":" + timestamp.toString();
    let entity = new ChainlinkPrice(id);
    entity.token = token;
    entity.value = value;
    entity.timestamp = timestamp.toI32();
    entity.period = "any";
    entity.save();

    // update latest price of this token
    let latestId = token;
    let latestEntity = _getOrCreateChainlinkPrice(latestId, token);

    let lastPrice = latestEntity.value;

    latestEntity.token = token;
    latestEntity.value = value;
    latestEntity.timestamp = timestamp.toI32();
    latestEntity.period = "last";
    latestEntity.save();

    _updateALPPrice(token, lastPrice, value, timestamp)
}

function _updateALPPrice(token: string, lastPrice: BigInt, newPrice: BigInt, timestamp: BigInt):void {
  
  let entity = TokenStat.load('total:'+token.toLowerCase())
  let alpEntity = AlpStat.load('total')
  if (entity == null) {
    return
  }
  if(alpEntity == null) {
      return
  }
  let priceDelta = newPrice - lastPrice
  let amount = getTokenAmountUsdWithPrice(token, entity.poolAmount, priceDelta)
  if(alpEntity.alpSupply != ZERO) {
    let delta = amount/(alpEntity.alpSupply*BigInt.fromI32(10).pow(4))// 30 decimals / 18+4 decimals = 8 decimals
    _updateChainlinkPrice(ALP, delta, timestamp)
  }
}

function _updateChainlinkPrice(token: string, delta: BigInt, timestamp: BigInt): void {

    // update latest price of this token
    let latestId = token;
    let latestEntity =  _getOrCreateChainlinkPrice(latestId, token);
    latestEntity.value += delta;
    latestEntity.timestamp = timestamp.toI32();
    latestEntity.save();
  
  
    let id = token + ":" + timestamp.toString();
    let entity = new ChainlinkPrice(id);
    entity.token = token;
    entity.value = latestEntity.value;
    entity.timestamp = timestamp.toI32();
    entity.period = "any";
    entity.save();
  }

function _getOrCreateChainlinkPrice(id: string, token: string): ChainlinkPrice {
    let entity = ChainlinkPrice.load(id)
    if (entity === null) {
      entity = new ChainlinkPrice(id)
      entity.token = token.toString()
      entity.value = ZERO
      entity.timestamp = ZERO.toI32();
      entity.period = 'last'
    }
    return entity as ChainlinkPrice
}

function _getOrCreateAlpStat(id: string, period: string): AlpStat {
    let entity = AlpStat.load(id)
    if (entity == null) {
      entity = new AlpStat(id)
      entity.period = period
      entity.alpSupply = ZERO
      entity.aumInUsda = ZERO
      entity.distributedEth = ZERO
      entity.distributedEthCumulative = ZERO
      entity.distributedUsd = ZERO
      entity.distributedUsdCumulative = ZERO
      entity.distributedEsgmx = ZERO
      entity.distributedEsgmxCumulative = ZERO
      entity.distributedEsgmxUsd = ZERO
      entity.distributedEsgmxUsdCumulative = ZERO
      // entity.timestamp = timestamp
    }
    return entity as AlpStat
  }
  

export function handleAnswerUpdatedBTC(event: AnswerUpdatedEvent): void {
    _storeChainlinkPrice(WBTC, event.params.current, event.block.timestamp);
}

export function handleAnswerUpdatedETH(event: AnswerUpdatedEvent): void {
    _storeChainlinkPrice(WETH, event.params.current, event.block.timestamp);
}

export function handleAnswerUpdatedUSDC(event: AnswerUpdatedEvent): void {
    _storeChainlinkPrice(USDC, event.params.current, event.block.timestamp);
}

export function handleAnswerUpdatedUSDT(event: AnswerUpdatedEvent): void {
    _storeChainlinkPrice(USDT, event.params.current, event.block.timestamp);
}

export function handleAnswerUpdatedMATIC(event: AnswerUpdatedEvent): void {
    _storeChainlinkPrice(WMATIC, event.params.current, event.block.timestamp);
}





