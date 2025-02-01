export interface UserMessage {
  type: 'user'
  user: string
}

export interface PlanMessage {
  type: 'plan'
  plan: string
}

export interface ActionMessage {
  type: 'action'
  function: 'getWeatherDetails'
  input: string
}

export interface ObservationMessage {
  type: 'observation'
  observation: number
}

export interface OutputMessage {
  type: 'output'
  output: string
}

export type BotMessage =
  | PlanMessage
  | ActionMessage
  | ObservationMessage
  | OutputMessage

export type Message = UserMessage | BotMessage

export interface WeatherData {
  [key: string]: number
}

export interface Tools {
  getWeatherDetails: (location: string) => Promise<number>
}
