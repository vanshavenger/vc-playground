import type { FetchTweetsResult, Tweet } from './types'

export const fetchTweets = async (
  username: string
): Promise<FetchTweetsResult> => {
  try {
    const response = await fetch(
      `https://twttrapi.p.rapidapi.com/user-tweets?username=${encodeURIComponent(username)}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': Bun.env.RAPID_API_HOST || '',
          'x-rapidapi-key': Bun.env.RAPID_API_KEY || '',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    const timelineResponse =
      data?.data?.user_result?.result?.timeline_response?.timeline?.instructions?.find(
        (x: any) => x.__typename === 'TimelineAddEntries'
      )

    if (!timelineResponse?.entries) {
      return { status: 'success', data: [] }
    }

    const tweets: Tweet[] = timelineResponse.entries
      .map((entry: any) => {
        const tweetResult = entry?.content?.content?.tweetResult?.result
        if (tweetResult) {
          return {
            contents:
              tweetResult.legacy?.full_text ??
              tweetResult.core?.user_result?.result?.legacy?.description ??
              '',
            id: tweetResult.core?.user_result?.result?.legacy?.id_str ?? '',
            createdAt: tweetResult.legacy?.created_at ?? '',
          }
        }
        return null
      })
      .filter((tweet: Tweet): tweet is Tweet =>
        Boolean(tweet && tweet.contents && tweet.id && tweet.createdAt)
      )

    return { status: 'success', data: tweets }
  } catch (error) {
    console.error('Error fetching tweets:', error)
    return {
      status: 'error',
      error: 'An error occurred while fetching tweets',
    }
  }
}
