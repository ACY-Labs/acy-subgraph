import { BigInt, Address } from "@graphprotocol/graph-ts"
import {
  OrderBook,
  CancelDecreaseOrder,
  CancelIncreaseOrder,
  CancelSwapOrder,
  CreateDecreaseOrder,
  CreateIncreaseOrder,
  CreateSwapOrder,
  ExecuteDecreaseOrder,
  ExecuteIncreaseOrder,
  ExecuteSwapOrder,
  Initialize,
  UpdateDecreaseOrder,
  UpdateGov,
  UpdateIncreaseOrder,
  UpdateMinExecutionFee,
  UpdateMinPurchaseTokenAmountUsd,
  UpdateSwapOrder
} from "../generated/OrderBook/OrderBook"
import { Order } from "../generated/schema"

const INCREASE_TYPE = "increase";
const DECREASE_TYPE = "decresse";

function _getId(account: Address, type: string, orderIndex: BigInt): string {
  let id = account.toHexString() + "-" + type + "-" + orderIndex.toString();
  return id;
}

function _handleCreateOrder(
  type: string, 
  account: Address, 
  orderIndex: BigInt,
  indexToken: string, 
  sizeDelta: BigInt,
  isLong: boolean,
  triggerPrice: BigInt,
  triggerAboveThreshold: boolean
  ): void {
  let id = _getId(account, type, orderIndex);
  let order = new Order(id);

  order.type = type;
  order.status = "open";

  order.account = account.toHexString();
  order.orderIndex = orderIndex;
  order.indexToken = indexToken; 
  order.sizeDelta = sizeDelta;
  order.isLong = isLong;
  order.triggerPrice = triggerPrice;
  order.triggerAboveThreshold = triggerAboveThreshold;

  order.save();
}

function _handleCancelOrder(type: string, account: Address, orderIndex: BigInt): void {
  let id = _getId(account, type, orderIndex);
  let order = Order.load(id);

  if (order != null) {
    order.status = "cancelled";
    order.save();
  }
}

function _handleExecuteOrder(type: string, account: Address, orderIndex: BigInt): void {
  let id = _getId(account, type, orderIndex);
  let order = Order.load(id);

  if (order != null) {
    order.status = "executed";
    order.save();
  }
}

export function handleCreateIncreaseOrder(event: CreateIncreaseOrder): void {
  _handleCreateOrder(
    INCREASE_TYPE, 
    event.params.account, 
    event.params.orderIndex, 
    event.params.indexToken.toHexString(),
    event.params.sizeDelta,
    event.params.isLong,
    event.params.triggerPrice,
    event.params.triggerAboveThreshold
  );
}

export function handleCreateDecreaseOrder(event: CreateDecreaseOrder): void {
  _handleCreateOrder(
    DECREASE_TYPE, 
    event.params.account, 
    event.params.orderIndex, 
    event.params.indexToken.toHexString(),
    event.params.sizeDelta,
    event.params.isLong,
    event.params.triggerPrice,
    event.params.triggerAboveThreshold
  );
}

export function handleCancelIncreaseOrder(event: CancelIncreaseOrder): void {
  _handleCancelOrder(INCREASE_TYPE, event.params.account, event.params.orderIndex);
}
export function handleCancelDecreaseOrder(event: CancelDecreaseOrder): void {
  _handleCancelOrder(DECREASE_TYPE, event.params.account, event.params.orderIndex);
}


export function handleExecuteIncreaseOrder(event: ExecuteIncreaseOrder): void {
  _handleExecuteOrder(INCREASE_TYPE, event.params.account, event.params.orderIndex);
}
export function handleExecuteDecreaseOrder(event: ExecuteDecreaseOrder): void {
  _handleExecuteOrder(DECREASE_TYPE, event.params.account, event.params.orderIndex);
}

export function handleCancelSwapOrder(event: CancelSwapOrder): void {}

export function handleCreateSwapOrder(event: CreateSwapOrder): void {}

export function handleExecuteSwapOrder(event: ExecuteSwapOrder): void {}

export function handleInitialize(event: Initialize): void {}

export function handleUpdateDecreaseOrder(event: UpdateDecreaseOrder): void {}

export function handleUpdateGov(event: UpdateGov): void {}

export function handleUpdateIncreaseOrder(event: UpdateIncreaseOrder): void {}

export function handleUpdateMinExecutionFee(
  event: UpdateMinExecutionFee
): void {}

export function handleUpdateMinPurchaseTokenAmountUsd(
  event: UpdateMinPurchaseTokenAmountUsd
): void {}

export function handleUpdateSwapOrder(event: UpdateSwapOrder): void {}
