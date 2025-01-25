import { sleep } from 'bun'
import { fetchTweets } from './fetchTweets'
import { extractToken } from './getTokenFromLLM'
import type { Tweet } from './types'
import { performSwap, swap } from './swap'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'

const SOL = 0.00001 * LAMPORTS_PER_SOL

async function main() {
  const result = await fetchTweets('AltcoinGordon')

  if (result.status === 'error') {
    console.error(result.error)
    return
  }

  const tweets: Tweet[] = result.data
  console.log(`Number of tweets: ${tweets.length}`)

  for (const tweet of tweets) {
    await sleep(3000)
    const tokenAddress = await extractToken(tweet.contents)
    if (tokenAddress.type !== 'ADDRESS') {
      continue
    }

    await performSwap(tokenAddress.result, SOL)
  }
}

main().catch(console.error)
