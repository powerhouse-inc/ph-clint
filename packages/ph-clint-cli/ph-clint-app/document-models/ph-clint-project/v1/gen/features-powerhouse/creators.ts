import { createAction } from "document-model";
import {
  EnablePowerhouseInputSchema,
  SetPowerhouseSwitchboardInputSchema,
  SetPowerhouseConnectInputSchema,
} from "../schema/zod.js";
import type {
  EnablePowerhouseInput,
  SetPowerhouseSwitchboardInput,
  SetPowerhouseConnectInput,
} from "../types.js";
import type {
  EnablePowerhouseAction,
  SetPowerhouseSwitchboardAction,
  SetPowerhouseConnectAction,
} from "./actions.js";

export const enablePowerhouse = (input: EnablePowerhouseInput) =>
  createAction<EnablePowerhouseAction>(
    "ENABLE_POWERHOUSE",
    { ...input },
    undefined,
    EnablePowerhouseInputSchema,
    "global",
  );

export const setPowerhouseSwitchboard = (
  input: SetPowerhouseSwitchboardInput,
) =>
  createAction<SetPowerhouseSwitchboardAction>(
    "SET_POWERHOUSE_SWITCHBOARD",
    { ...input },
    undefined,
    SetPowerhouseSwitchboardInputSchema,
    "global",
  );

export const setPowerhouseConnect = (input: SetPowerhouseConnectInput) =>
  createAction<SetPowerhouseConnectAction>(
    "SET_POWERHOUSE_CONNECT",
    { ...input },
    undefined,
    SetPowerhouseConnectInputSchema,
    "global",
  );
