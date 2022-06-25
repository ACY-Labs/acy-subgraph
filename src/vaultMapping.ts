import { BigInt, Address, Bytes, TypedMap, ethereum, store } from "@graphprotocol/graph-ts"


import {
  Vault,
  BuyUSDA,
  ClosePosition,
  CollectMarginFees,
  CollectSwapFees,
  DecreaseCollateralsPool,
  DecreaseGlobalNetUsd,
  DecreaseNetPosition,
  DecreasePoolAmount,
  DecreasePosition as DecreasePositionEvent,
  DecreaseReservedAmount,
  DecreaseUsdaAmount,
  DirectPoolDeposit,
  IncreaseCollateralsPool,
  IncreaseGlobalNetUsd,
  IncreaseNetPosition,
  IncreasePoolAmount,
  IncreasePosition as IncreasePositionEvent,
  IncreaseReservedAmount,
  IncreaseUsdaAmount,
  LiquidatePosition,
  SellUSDA,
  Swap as SwapEvent,
  UpdateBorrowRate,
  UpdatePnl,
  UpdatePosition
} from "../generated/Vault/Vault"
import { 
  ActivePosition, 
  Transaction, 
  Account, 
  ChainlinkPrice,
  HourlyVolume,
  VolumeStat,
  HourlyVolumeBySource,
  HourlyFee,
  FeeStat,
  UserStat,
  UserData,
  TokenStat,
  TokenPool,
  AlpStat,
  Swap,
  OnChainTransaction,
  HourlyVolumeByToken,
  OpeningPosition,
  BorrowRate,
  LiquidatedPosition
 } from "../generated/schema"
import { getTokenSymbol, ALP } from "./tokenList"
import { 
  BASIS_POINTS_DIVISOR ,
  timestampToPeriod,
  getTokenAmountUsd,
  getWeekId,
  getDayId,
  getHourId,
  getIdFromEvent,
  TRADE_TYPES,
  ZERO,
  getTokenDecimals,
  getTokenPrice,
  FUNDING_PRECISION
} from "./helper"

import { LIQUIDATOR_ADDRESS } from "./constants"

export function handleBuyUSDA(event: BuyUSDA): void {
  let volume = event.params.usdaAmount * BigInt.fromString("1000000000000")
  _storeVolume("mint", event.block.timestamp, volume)
  _storeVolumeBySource("mint", event.block.timestamp, event.transaction.to, volume)

  let fee = volume * event.params.feeBasisPoints / BASIS_POINTS_DIVISOR
  _storeFees("mint", event.block.timestamp, fee)
  _storeUserAction(event.block.timestamp, event.params.account, "mintBurn")
}

export function handleClosePosition(event: ClosePosition): void {
    // remove ActivePosition
  let id = event.params.key.toHexString();
  store.remove('ActivePosition', id);
}

export function handleCollectMarginFees(event: CollectMarginFees): void {
  _storeFees("marginAndLiquidation", event.block.timestamp, event.params.feeUsd)
}

export function handleCollectSwapFees(event: CollectSwapFees): void {

}

export function handleDecreaseGlobalNetUsd(event: DecreaseGlobalNetUsd): void {

}

export function handleDecreaseNetPosition(event: DecreaseNetPosition): void {}

export function handleDecreasePoolAmount(event: DecreasePoolAmount): void {
  let timestamp = event.block.timestamp
  let token = event.params.token
  let totalEntity = _getOrCreateTokenStat(timestamp, "total", token)
  totalEntity.poolAmount -= event.params.amount
  totalEntity.poolAmountUsd = getTokenAmountUsd(token.toHexString(), totalEntity.poolAmount)
  totalEntity.save()

  _updatePoolAmount(timestamp, "hourly", token, totalEntity.poolAmount, totalEntity.poolAmountUsd);
  _updatePoolAmount(timestamp, "daily", token, totalEntity.poolAmount, totalEntity.poolAmountUsd);
  _updatePoolAmount(timestamp, "weekly", token, totalEntity.poolAmount, totalEntity.poolAmountUsd);

  //calcualte alp price
  let amountUsd = getTokenAmountUsd(token.toHexString(), event.params.amount)
  let alpTotalEntity = _getOrCreateAlpStat("total", "total")
  let alpSupply = alpTotalEntity.alpSupply
  if(alpSupply != ZERO) {
    let value = amountUsd/alpSupply // 30 decimals / 18 decimals = 12 decimals
    _decreaseChainlinkPrice(ALP, value, event.block.timestamp)
  }
}

export function handleDecreasePosition(event: DecreasePositionEvent): void {

  _storeVolume("margin", event.block.timestamp, event.params.sizeDelta)
  _storeVolumeBySource("margin", event.block.timestamp, event.transaction.to, event.params.sizeDelta)
  _storeVolumeByToken("margin", event.block.timestamp, event.params.collateralToken, event.params.indexToken, event.params.sizeDelta)
  _storeFees("margin", event.block.timestamp, event.params.fee)
  _storeUserAction(event.block.timestamp, event.params.account, "margin")

  if (event.transaction.from.toHexString() == LIQUIDATOR_ADDRESS) {
    _storeLiquidatedPosition(
      event.params.key,
      event.block.timestamp,
      event.params.account,
      event.params.indexToken,
      event.params.sizeDelta,
      event.params.collateralToken,
      event.params.collateralDelta,
      event.params.isLong,
      "partial",
      event.params.price
    )
  }

    // 创建新的 Transaction
  let txEntity = new Transaction(event.transaction.hash.toHexString());
  txEntity.account = event.params.account.toHexString();
  txEntity.indexToken = event.params.indexToken.toHexString();
  txEntity.indexTokenSymbol = getTokenSymbol(event.params.indexToken.toHexString());
  txEntity.sizeDelta = event.params.sizeDelta;
  txEntity.isLong = event.params.isLong;
  txEntity.price = event.params.price;
  txEntity.save();

  let accountId = event.params.account.toHexString();
  let accountEntity = Account.load(accountId);
  if(accountEntity == null){
    let accountEntity = new Account(accountId);
    accountEntity.transactions = [txEntity.id];
    accountEntity.save();
  }else {
    let txs = accountEntity.transactions;
    txs.push(txEntity.id);
    accountEntity.transactions = txs;
    accountEntity.save();
  }
}

export function handleDecreaseReservedAmount(event: DecreaseReservedAmount): void {}

export function handleDecreaseUsdaAmount(event: DecreaseUsdaAmount): void {}

export function handleDirectPoolDeposit(event: DirectPoolDeposit): void {}

export function handleIncreaseGlobalNetUsd(event: IncreaseGlobalNetUsd): void {}

export function handleIncreaseNetPosition(event: IncreaseNetPosition): void {}

export function handleIncreasePoolAmount(event: IncreasePoolAmount): void {
  let timestamp = event.block.timestamp
  let token = event.params.token
  let totalEntity = _getOrCreateTokenStat(timestamp, "total", token)
  totalEntity.poolAmount += event.params.amount
  totalEntity.poolAmountUsd = getTokenAmountUsd(token.toHexString(), totalEntity.poolAmount)
  totalEntity.save()

  _updatePoolAmount(timestamp, "hourly", token, totalEntity.poolAmount, totalEntity.poolAmountUsd);
  _updatePoolAmount(timestamp, "daily", token, totalEntity.poolAmount, totalEntity.poolAmountUsd);
  _updatePoolAmount(timestamp, "weekly", token, totalEntity.poolAmount, totalEntity.poolAmountUsd);

  // calcualte alp price
  let amountUsd = getTokenAmountUsd(token.toHexString(), event.params.amount)
  let alpTotalEntity = _getOrCreateAlpStat("total", "total")
  let alpSupply = alpTotalEntity.alpSupply
  if(alpSupply != ZERO) {
    let value = amountUsd/alpSupply // 30 decimals / 18 decimals
    _increaseChainlinkPrice(ALP, value, event.block.timestamp)
  }
}

export function handleIncreasePosition(event: IncreasePositionEvent): void {

  _storeVolume("margin", event.block.timestamp, event.params.sizeDelta)
  _storeVolumeBySource("margin", event.block.timestamp, event.transaction.to, event.params.sizeDelta)
  _storeVolumeByToken("margin", event.block.timestamp, event.params.collateralToken, event.params.indexToken, event.params.sizeDelta)
  _storeFees("margin", event.block.timestamp, event.params.fee)
  _storeUserAction(event.block.timestamp, event.params.account, "margin")

    // 创建新的 or 更新 ActivePosition
  let positionEntity = new ActivePosition(event.params.key.toHexString());
  positionEntity.account = event.params.account.toHexString();
  positionEntity.collateralToken = event.params.collateralToken.toHexString();
  positionEntity.indexToken = event.params.indexToken.toHexString();
  positionEntity.isLong = event.params.isLong;
  positionEntity.save();

  // 创建新的 Transaction
  let txEntity = new Transaction(event.transaction.hash.toHexString());
  txEntity.account = event.params.account.toHexString();
  txEntity.indexToken = event.params.indexToken.toHexString();
  txEntity.indexTokenSymbol = getTokenSymbol(event.params.indexToken.toHexString());
  txEntity.sizeDelta = event.params.sizeDelta;
  txEntity.isLong = event.params.isLong;
  txEntity.price = event.params.price;
  txEntity.save();

  let accountId = event.params.account.toHexString();
  let accountEntity = Account.load(accountId);
  if(accountEntity == null){
    let accountEntity = new Account(accountId);
    accountEntity.transactions = [txEntity.id];
    accountEntity.save();
  } else {
    let txs = accountEntity.transactions;
    txs.push(txEntity.id);
    accountEntity.transactions = txs;
    accountEntity.save();
  }
}

export function handleIncreaseReservedAmount(event: IncreaseReservedAmount): void {}

export function handleIncreaseUsdaAmount(event: IncreaseUsdaAmount): void {}

export function handleLiquidatePosition(event: LiquidatePosition): void {
  // remove ActivePosition
  let id = event.params.key.toHexString();
  store.remove('ActivePosition', id);
}

export function handleSellUSDA(event: SellUSDA): void {
  let volume = event.params.usdaAmount * BigInt.fromString("1000000000000")
  _storeVolumeBySource("burn", event.block.timestamp, event.transaction.to, volume)
  _storeVolume("burn", event.block.timestamp, volume)

  let fee = volume * event.params.feeBasisPoints / BASIS_POINTS_DIVISOR
  _storeFees("burn", event.block.timestamp, fee)
  _storeUserAction(event.block.timestamp, event.params.account, "mintBurn")
}

export function handleSwap(event: SwapEvent): void {
}

export function handleUpdateBorrowRate(event: UpdateBorrowRate): void {
  const FUNDING_INTERVAL = 3600
  let fundingIntervalTimestamp = event.block.timestamp.toI32() / FUNDING_INTERVAL * FUNDING_INTERVAL

  let timestamp = getDayId(event.block.timestamp)
  let id = _getBorrowRateId(timestamp, event.params.token)
  let entity = BorrowRate.load(id)

  let totalId = _getBorrowRateId("total", event.params.token)
  let totalEntity = BorrowRate.load(totalId)

  if (entity == null) {
    entity = new BorrowRate(id)
    if (totalEntity) {
      entity.startBorrowRate = totalEntity.endBorrowRate
      entity.startTimestamp = totalEntity.endTimestamp
    } else {
      entity.startBorrowRate = 0
      entity.startTimestamp = fundingIntervalTimestamp
    }
    entity.timestamp = BigInt.fromString(timestamp).toI32()
    entity.token = event.params.token.toHexString()
    entity.period = "daily"
  }
  entity.endBorrowRate = event.params.borrowRate.toI32()
  entity.endTimestamp = fundingIntervalTimestamp
  entity.save()

  if (totalEntity == null) {
    totalEntity = new BorrowRate(totalId)
    totalEntity.period = "total"
    totalEntity.startBorrowRate = 0
    totalEntity.token = event.params.token.toHexString()
    totalEntity.startTimestamp = fundingIntervalTimestamp
  }
  totalEntity.endBorrowRate = event.params.borrowRate.toI32()
  totalEntity.timestamp = BigInt.fromString(timestamp).toI32()
  totalEntity.endTimestamp = fundingIntervalTimestamp
  totalEntity.save()
}
function _getBorrowRateId(timeKey: string, token: Address): string {
  return timeKey + ":" + token.toHexString()
}

export function handleUpdatePnl(event: UpdatePnl): void {}

export function handleUpdatePosition(event: UpdatePosition): void {
  let entity = new OpeningPosition(event.params.key.toHexString())
  entity.averagePrice = event.params.averagePrice
  entity.entryBorrowRate = event.params.entryFundingRate
  entity.collateral = event.params.collateral
  entity.size = event.params.size
  entity.save()
}

export function handleIncreaseCollateralsPool(event: IncreaseCollateralsPool): void {
  _updateTokenPool(event.params.token, event.params.amount, "collateralsPool", event.block.timestamp)
  _updateAlpPrice(ALP, -event.params.amount, event.block.timestamp)
}


export function handleDecreaseCollateralsPool(event: DecreaseCollateralsPool): void {
  _updateTokenPool(event.params.token, -event.params.amount, "collateralsPool", event.block.timestamp)
  _updateAlpPrice(ALP, event.params.amount, event.block.timestamp)
}

function _updateTokenPool(token: Address, delta: BigInt, type: string, timestamp: BigInt): void {
  let entity = _getOrCreateTokenPool(token, type);
  entity.amount += delta;
  entity.timestamp = timestamp.toI32();
  entity.save();
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

function _increaseChainlinkPrice(token: string, value: BigInt, timestamp: BigInt): void {

  // update latest price of this token
  let latestId = token;
  let latestEntity =  _getOrCreateChainlinkPrice(latestId, token);
  latestEntity.value += value;
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

function _decreaseChainlinkPrice(token: string, value: BigInt, timestamp: BigInt): void {


  // update latest price of this token
  let latestId = token;
  let latestEntity =  _getOrCreateChainlinkPrice(latestId, token);
  latestEntity.value -= value
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

function _updateAlpPrice(token: string, aumInUsdaDelta: BigInt, timestamp: BigInt): void {


  let alpTotalEntity = _getOrCreateAlpStat("total", "total")
  let alpSupply = alpTotalEntity.alpSupply
  if(alpSupply == ZERO) {
    return
  }
  let delta = aumInUsdaDelta/alpSupply // 30 decimals / 18 decimals

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


function _storeVolume(type: string, timestamp: BigInt, volume: BigInt): void {
  let deprecatedId = getHourId(timestamp)
  let deprecatedEntity = HourlyVolume.load(deprecatedId)

  if (deprecatedEntity == null) {
    deprecatedEntity = new HourlyVolume(deprecatedId)
    for (let i = 0; i < TRADE_TYPES.length; i++) {
      let _type = TRADE_TYPES[i]
      deprecatedEntity.setBigInt(_type, ZERO)
    }
  }

  deprecatedEntity.setBigInt(type, deprecatedEntity.getBigInt(type) + volume)
  deprecatedEntity.save()

  //

  let id = getDayId(timestamp)
  let entity = _getOrCreateVolumeStat(id, "daily")
  entity.setBigInt(type, entity.getBigInt(type) + volume)
  entity.save()

  let totalEntity = _getOrCreateVolumeStat("total", "total")
  totalEntity.setBigInt(type, totalEntity.getBigInt(type) + volume)
  totalEntity.save()
}

function _storeVolumeBySource(type: string, timestamp: BigInt, source: Address | null, volume: BigInt): void {
  let id : string;
  if (!source) {
    id = getHourId(timestamp) + ":";
  } else {
    id = getHourId(timestamp) + ":" + source.toHexString();
  }
  
  let entity = HourlyVolumeBySource.load(id)

  if (entity == null) {
    entity = new HourlyVolumeBySource(id)
    if (!source) {
      entity.source = Address.fromString("")
    } else {
      entity.source = Address.fromString(source.toHexString())
    }
    entity.timestamp = timestamp.toI32() / 3600 * 3600
    for (let i = 0; i < TRADE_TYPES.length; i++) {
      let _type = TRADE_TYPES[i]
      entity.setBigInt(_type, ZERO)
    }
  }

  entity.setBigInt(type, entity.getBigInt(type) + volume)
  entity.save()
}


function _getOrCreateVolumeStat(id: string, period: string): VolumeStat {
  let entity = VolumeStat.load(id)
  if (entity === null) {
    entity = new VolumeStat(id)
    entity.margin = ZERO
    entity.swap = ZERO
    entity.liquidation = ZERO
    entity.mint = ZERO
    entity.burn = ZERO
    entity.period = period
  }
  return entity as VolumeStat
}

function _storeVolumeByToken(type: string, timestamp: BigInt, tokenA: Address, tokenB: Address, volume: BigInt): void {
  let id = getHourId(timestamp) + ":" + tokenA.toHexString() + ":" + tokenB.toHexString()
  let entity = HourlyVolumeByToken.load(id)

  if (entity == null) {
    entity = new HourlyVolumeByToken(id)
    entity.tokenA = tokenA
    entity.tokenB = tokenB
    entity.timestamp = timestamp.toI32() / 3600 * 3600
    for (let i = 0; i < TRADE_TYPES.length; i++) {
      let _type = TRADE_TYPES[i]
      entity.setBigInt(_type, ZERO)
    }
  }

  entity.setBigInt(type, entity.getBigInt(type) + volume)
  entity.save()
}


function _storeFees(type: string, timestamp: BigInt, fees: BigInt): void {
  let deprecatedId = getHourId(timestamp)
  let entityDeprecated = HourlyFee.load(deprecatedId)

  if (entityDeprecated == null) {
    entityDeprecated = new HourlyFee(deprecatedId)
    for (let i = 0; i < TRADE_TYPES.length; i++) {
      let _type = TRADE_TYPES[i]
      entityDeprecated.setBigInt(_type, ZERO)
    }
  }

  entityDeprecated.setBigInt(type, entityDeprecated.getBigInt(type) + fees)
  entityDeprecated.save()

  let id = getDayId(timestamp)
  let entity = _getOrCreateFeeStat(id, "daily")
  entity.setBigInt(type, entity.getBigInt(type) + fees)
  entity.save()

  let totalEntity = _getOrCreateFeeStat("total", "total")
  totalEntity.setBigInt(type, totalEntity.getBigInt(type) + fees)
  totalEntity.save()
}

function _getOrCreateFeeStat(id: string, period: string): FeeStat {
  let entity = FeeStat.load(id)
  if (entity === null) {
    entity = new FeeStat(id)
    for (let i = 0; i < TRADE_TYPES.length; i++) {
      let _type = TRADE_TYPES[i]
      entity.setBigInt(_type, ZERO)
    }
    entity.period = period
  }
  return entity as FeeStat
}

function _storeUserAction(timestamp: BigInt, account: Address, actionType: String): void {
  let totalEntity = _storeUserActionByType(timestamp, account, actionType, "total", null)

  _storeUserActionByType(timestamp, account, actionType, "daily", totalEntity)
  _storeUserActionByType(timestamp, account, actionType, "weekly", totalEntity)
}


function _storeUserActionByType(
  timestamp: BigInt,
  account: Address,
  actionType: string,
  period: string,
  userStatTotal: UserStat | null
): UserStat {
  let timestampId = period == "weekly" ? getWeekId(timestamp) : getDayId(timestamp)
  let userId = period == "total" ? account.toHexString() : period + ":" + timestampId + ":" + account.toHexString()
  let user = UserData.load(userId)

  let statId = period == "total" ? "total" : period + ":" + timestampId
  let userStat = UserStat.load(statId)
  if (userStat == null) {
    userStat = new UserStat(statId)
    userStat.period = period
    userStat.timestamp = parseInt(timestampId) as i32

    userStat.uniqueCount = 0
    userStat.uniqueMarginCount = 0
    userStat.uniqueSwapCount = 0
    userStat.uniqueMintBurnCount = 0

    userStat.uniqueCountCumulative = 0
    userStat.uniqueMarginCountCumulative = 0
    userStat.uniqueSwapCountCumulative = 0
    userStat.uniqueMintBurnCountCumulative = 0

    userStat.actionCount = 0
    userStat.actionMarginCount = 0
    userStat.actionSwapCount = 0
    userStat.actionMintBurnCount = 0
  }

  if (user == null) {
    user = new UserData(userId) 
    user.period = period
    user.timestamp = parseInt(timestampId) as i32

    user.actionSwapCount = 0
    user.actionMarginCount = 0
    user.actionMintBurnCount = 0

    userStat.uniqueCount = userStat.uniqueCount + 1

    if (period == "total") {
      userStat.uniqueCountCumulative = userStat.uniqueCount
    } else if (userStatTotal != null) {
      userStat.uniqueCountCumulative = userStatTotal.uniqueCount
    }
  }

  userStat.actionCount += 1

  let actionCountProp: string
  let uniqueCountProp: string
  if (actionType == "margin") {
    actionCountProp = "actionMarginCount"
    uniqueCountProp = "uniqueMarginCount"
  } else if (actionType == "swap") {
    actionCountProp = "actionSwapCount"
    uniqueCountProp = "uniqueSwapCount"
  } else if (actionType == "mintBurn") {
    actionCountProp = "actionMintBurnCount"
    uniqueCountProp = "uniqueMintBurnCount"
  }
  let uniqueCountCumulativeProp = uniqueCountProp + "Cumulative"

  if (user.getI32(actionCountProp) == 0) {
    userStat.setI32(uniqueCountProp, userStat.getI32(uniqueCountProp) + 1)
  }
  user.setI32(actionCountProp, user.getI32(actionCountProp) + 1)
  userStat.setI32(actionCountProp, userStat.getI32(actionCountProp) + 1)

  if (period == "total") {
    userStat.setI32(uniqueCountCumulativeProp, userStat.getI32(uniqueCountProp))
  } else if (userStatTotal != null) {
    userStat.setI32(uniqueCountCumulativeProp, userStatTotal.getI32(uniqueCountProp))
  }

  user.save()
  userStat.save()

  return userStat as UserStat
}

function _updatePoolAmount(
  timestamp: BigInt,
  period: string,
  token: Address,
  poolAmount: BigInt,
  poolAmountUsd: BigInt
): void {
  let entity = _getOrCreateTokenStat(timestamp, period, token)
  entity.poolAmount = poolAmount
  entity.poolAmountUsd = poolAmountUsd
  entity.save()
}

function _getOrCreateTokenStat(timestamp: BigInt, period: string, token: Address): TokenStat {
  let id: string
  let timestampGroup: BigInt
  if (period == "total") {
    id = "total:" + token.toHexString()
    timestampGroup = timestamp
  } else {
    timestampGroup = timestampToPeriod(timestamp, period)
    id = timestampGroup.toString() + ":" + period + ":" + token.toHexString()
  }

  let entity = TokenStat.load(id)
  if (entity == null) {
    entity = new TokenStat(id)
    entity.timestamp = timestampGroup.toI32()
    entity.period = period
    entity.token = token.toHexString()
    entity.poolAmount = BigInt.fromI32(0);
    entity.poolAmountUsd = BigInt.fromI32(0);
  }
  return entity as TokenStat;
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

function _storeLiquidatedPosition(
  keyBytes: Bytes,
  timestamp: BigInt,
  account: Address,
  indexToken: Address,
  size: BigInt,
  collateralToken: Address,
  collateral: BigInt,
  isLong: boolean,
  type: string,
  markPrice: BigInt
): void {
  let key = keyBytes.toHexString()
  let position = OpeningPosition.load(key)
  if(position == null) return;
  let averagePrice = position.averagePrice

  let id = key + ":" + timestamp.toString()
  let liquidatedPosition = new LiquidatedPosition(id)
  liquidatedPosition.account = account.toHexString()
  liquidatedPosition.timestamp = timestamp.toI32()
  liquidatedPosition.indexToken = indexToken.toHexString()
  liquidatedPosition.size = size
  liquidatedPosition.collateralToken = collateralToken.toHexString()
  liquidatedPosition.collateral = position.collateral
  liquidatedPosition.isLong = isLong
  liquidatedPosition.type = type
  liquidatedPosition.key = key

  liquidatedPosition.markPrice = markPrice
  liquidatedPosition.averagePrice = averagePrice
  let priceDelta = isLong ? averagePrice - markPrice : markPrice - averagePrice
  liquidatedPosition.loss = size * priceDelta / averagePrice

  let borrowRateId = _getBorrowRateId("total", collateralToken)
  let borrowRateEntity = BorrowRate.load(borrowRateId)
  if(borrowRateEntity == null) return
  let accruedBorrowRate = BigInt.fromI32(borrowRateEntity.endBorrowRate) - position.entryBorrowRate
  liquidatedPosition.borrowFee = accruedBorrowRate * size / FUNDING_PRECISION

  liquidatedPosition.save()
}

function _getOrCreateTokenPool(token: Address, type: string ): TokenPool {
  let id = token.toHexString() + ':' + type
  let entity = TokenPool.load(id)
  if (entity === null) {
    entity = new TokenPool(id)
    entity.token = token.toHexString()
    entity.amount = ZERO
    entity.timestamp = ZERO.toI32()
    entity.type = type
  }
  return entity as TokenPool
}




