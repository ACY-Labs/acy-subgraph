import { BigInt } from "@graphprotocol/graph-ts"
// the abis and events are same for all tokens, so importing any of them is enough
import { AnswerUpdated as AnswerUpdatedEvent } from "../generated/ChainlinkAggregatorBTC/ChainlinkAggregator"

import { ChainlinkPrice } from "../generated/schema"
import {USDC, USDT, WETH, WBTC, WMATIC} from "./tokenList"

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


