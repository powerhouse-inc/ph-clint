import type { Action } from "document-model";
import type {
  EnablePowerhouseInput,
  SetPowerhouseSwitchboardInput,
  SetPowerhouseConnectInput,
} from "../types.js";

export type EnablePowerhouseAction = Action & {
  type: "ENABLE_POWERHOUSE";
  input: EnablePowerhouseInput;
};
export type SetPowerhouseSwitchboardAction = Action & {
  type: "SET_POWERHOUSE_SWITCHBOARD";
  input: SetPowerhouseSwitchboardInput;
};
export type SetPowerhouseConnectAction = Action & {
  type: "SET_POWERHOUSE_CONNECT";
  input: SetPowerhouseConnectInput;
};

export type PhClintProjectFeaturesPowerhouseAction =
  | EnablePowerhouseAction
  | SetPowerhouseSwitchboardAction
  | SetPowerhouseConnectAction;
