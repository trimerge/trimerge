export type JSONLiteral = string | number | boolean | null | undefined;
export type JSONValue = JSONLiteral | JSONObject | JSONArray;
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface JSONObject extends Record<string, JSONValue> {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface JSONArray extends Array<JSONValue> {}
