export type JSONLiteral = string | number | boolean | null | undefined;
export type JSONValue = JSONLiteral | JSONObject | JSONArray;
export interface JSONObject extends Record<string, JSONValue> {}
export interface JSONArray extends Array<JSONValue> {}
