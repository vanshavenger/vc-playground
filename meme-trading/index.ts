import { sleep } from 'bun'
import { fetchTweets } from './fetchTweets'
import { extractToken } from './getTokenFromLLM'
import type { Tweet } from './types'

async function main() {
  const result = await fetchTweets('AltcoinGordon')

  if (result.status === 'error') {
    console.error(result.error)
    return
  }

  const tweets: Tweet[] = result.data
  console.log(`Number of tweets: ${tweets.length}`)

  for (const tweet of tweets) {
    await sleep(5000)
    const tokenAddress = await extractToken(tweet.contents)
    if (tokenAddress.type !== 'ADDRESS') {
      continue
    }

    console.log(tokenAddress.result)
  }
}

main().catch(console.error)
