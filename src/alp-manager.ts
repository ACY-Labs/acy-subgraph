import { BigInt } from "@graphprotocol/graph-ts"
import {
  AddLiquidity,
  RemoveLiquidity
} from "../generated/alpManager/alpManager"

import { ALP } from "./tokenList"
import { 
  AlpStat,
  HourlyAlpStat,
  ChainlinkPrice
} from "../generated/schema"

import { 
  getHourId,
  getDayId,
  ZERO,
  PRICE_PRECISION
} from "./helper"

export function handleAddLiquidity(event: AddLiquidity): void {
  _storeAlpStat(event.block.timestamp, event.params.alpSupply+event.params.mintAmount, event.params.aumInUsda + event.params.usdaAmount)
  _storeChainlinkPrice(ALP, (event.params.aumInUsda + event.params.usdaAmount)*PRICE_PRECISION / (event.params.alpSupply+event.params.mintAmount), event.block.timestamp)
}

export function handleRemoveLiquidity(event: RemoveLiquidity): void {
  _storeAlpStat(event.block.timestamp, event.params.alpSupply-event.params.alpAmount, event.params.aumInUsda+ event.params.usdaAmount)
  _storeChainlinkPrice(ALP, (event.params.aumInUsda + event.params.usdaAmount)*PRICE_PRECISION / (event.params.alpSupply-event.params.alpAmount), event.block.timestamp)
}

function _storeAlpStat(timestamp: BigInt, alpSupply: BigInt, aumInUsda: BigInt): void {
  let deprecatedId = getHourId(timestamp)
  let deprecatedEntity = HourlyAlpStat.load(deprecatedId)

  if (deprecatedEntity == null) {
    deprecatedEntity = new HourlyAlpStat(deprecatedId)
    deprecatedEntity.alpSupply = ZERO
    deprecatedEntity.aumInUsda = ZERO
  }

  deprecatedEntity.aumInUsda = aumInUsda
  deprecatedEntity.alpSupply = alpSupply

  deprecatedEntity.save()

  //

  let id = getDayId(timestamp)
  let totalEntity = _getOrCreateAlpStat("total", "total")
  totalEntity.aumInUsda = aumInUsda
  totalEntity.alpSupply = alpSupply
  totalEntity.save()

  let entity = _getOrCreateAlpStat(id, "daily")
  entity.aumInUsda = aumInUsda
  entity.alpSupply = alpSupply
  entity.save()

  
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
  let latestEntity = new ChainlinkPrice(latestId);
  latestEntity.token = token;
  latestEntity.value = value;
  latestEntity.timestamp = timestamp.toI32();
  latestEntity.period = "last";
  latestEntity.save();
}



