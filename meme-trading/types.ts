export interface Tweet {
  contents: string
  id: string
  createdAt: string
}

interface FetchTweetsSuccess {
  status: "success"
  data: Tweet[]
}

interface FetchTweetsError {
  status: "error"
  error: string
}
export type FetchTweetsResult = FetchTweetsSuccess | FetchTweetsError