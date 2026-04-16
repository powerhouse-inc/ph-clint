import { type SignalDispatch } from "document-model";
import type {
  EnablePowerhouseAction,
  SetPowerhouseSwitchboardAction,
  SetPowerhouseConnectAction,
} from "./actions.js";
import type { PhClintProjectState } from "../types.js";

export interface PhClintProjectFeaturesPowerhouseOperations {
  enablePowerhouseOperation: (
    state: PhClintProjectState,
    action: EnablePowerhouseAction,
    dispatch?: SignalDispatch,
  ) => void;
  setPowerhouseSwitchboardOperation: (
    state: PhClintProjectState,
    action: SetPowerhouseSwitchboardAction,
    dispatch?: SignalDispatch,
  ) => void;
  setPowerhouseConnectOperation: (
    state: PhClintProjectState,
    action: SetPowerhouseConnectAction,
    dispatch?: SignalDispatch,
  ) => void;
}
