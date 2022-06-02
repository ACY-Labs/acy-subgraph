import { BigInt, store } from "@graphprotocol/graph-ts"
import {
  Vault,
  BuyUSDG,
  ClosePosition,
  CollectMarginFees,
  CollectSwapFees,
  DecreaseGuaranteedUsd,
  DecreasePoolAmount,
  DecreasePosition,
  DecreaseReservedAmount,
  DecreaseUsdgAmount,
  DirectPoolDeposit,
  IncreaseGuaranteedUsd,
  IncreasePoolAmount,
  IncreasePosition,
  IncreaseReservedAmount,
  IncreaseUsdgAmount,
  LiquidatePosition,
  SellUSDG,
  Swap,
  UpdateFundingRate,
  UpdatePnl,
  UpdatePosition
} from "../generated/Vault/Vault"
import { ActivePosition, Transaction, Account } from "../generated/schema"
import { getTokenSymbol } from "./tokenList"


export function handleBuyUSDG(event: BuyUSDG): void {}

export function handleClosePosition(event: ClosePosition): void {
  // remove ActivePosition
  let id = event.params.key.toHexString();
  store.remove('ActivePosition', id);
}

export function handleCollectMarginFees(event: CollectMarginFees): void {}

export function handleCollectSwapFees(event: CollectSwapFees): void {}

export function handleDecreaseGuaranteedUsd(
  event: DecreaseGuaranteedUsd
): void {}

export function handleDecreasePoolAmount(event: DecreasePoolAmount): void {}

export function handleDecreaseReservedAmount(
  event: DecreaseReservedAmount
): void {}

export function handleDecreaseUsdgAmount(event: DecreaseUsdgAmount): void {}

export function handleDirectPoolDeposit(event: DirectPoolDeposit): void {}

export function handleIncreaseGuaranteedUsd(
  event: IncreaseGuaranteedUsd
): void {}

export function handleIncreasePoolAmount(event: IncreasePoolAmount): void {}

export function handleIncreasePosition(event: IncreasePosition): void {
  // 创建新的 or 更新 ActivePosition
  let positionEntity = new ActivePosition(event.params.key.toHexString());
  positionEntity.account = event.params.account.toHexString();
  positionEntity.collateralToken = event.params.collateralToken.toHexString();
  positionEntity.indexToken = event.params.indexToken.toHexString();
  positionEntity.isLong = event.params.isLong;
  positionEntity.save();

  // 创建新的 Transaction
  let txEntity = new Transaction(event.transaction.hash.toHexString());
  txEntity.timestamp = event.block.timestamp;
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

export function handleDecreasePosition(event: DecreasePosition): void {
  // 创建新的 Transaction
  let txEntity = new Transaction(event.transaction.hash.toHexString());
  txEntity.timestamp = event.block.timestamp;
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


export function handleIncreaseReservedAmount(
  event: IncreaseReservedAmount
): void {}

export function handleIncreaseUsdgAmount(event: IncreaseUsdgAmount): void {}

export function handleLiquidatePosition(event: LiquidatePosition): void {
  // remove ActivePosition
  let id = event.params.key.toHexString();
  store.remove('ActivePosition', id);
}

export function handleSellUSDG(event: SellUSDG): void {}

export function handleSwap(event: Swap): void {}

export function handleUpdateFundingRate(event: UpdateFundingRate): void {}

export function handleUpdatePnl(event: UpdatePnl): void {}

export function handleUpdatePosition(event: UpdatePosition): void {}