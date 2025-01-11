export const CONFIG = {
  PORT: 8080,
  HOST: "localhost",
} as const;

export const EVENTS = {
  CONNECTION: "connection",
  MESSAGE: "message",
  CLOSE: "close",
  ERROR: "error",
} as const;
