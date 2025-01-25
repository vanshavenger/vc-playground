import { fetchTweets } from "./fetchTweets"
import type { Tweet } from "./types"

async function main() {
  const result = await fetchTweets("elonmusk")

  if (result.status === "error") {
    console.error(result.error)
    return
  }

  const tweets: Tweet[] = result.data
  console.log(`Number of tweets: ${tweets.length}`)
}

main().catch(console.error)

