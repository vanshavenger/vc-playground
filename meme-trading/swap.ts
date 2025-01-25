import {
  Connection,
  Keypair,
  Transaction,
  VersionedTransaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js'
import {
  NATIVE_MINT,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token'
import axios from 'axios'
import { API_URLS, parseTokenAccountResp } from '@raydium-io/raydium-sdk-v2'
import bs58 from 'bs58'

const connection = new Connection(process.env.RPC_URL!, 'confirmed')
const owner = Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY!))

const slippage = 0.5
const txVersion = 'V0'
const isV0Tx = txVersion === 'V0'
const inputMint = NATIVE_MINT.toBase58()

export const fetchTokenAccountData = async () => {
  try {
    const [solAccountResp, tokenAccountResp, token2022Req] = await Promise.all([
      connection.getAccountInfo(owner.publicKey),
      connection.getTokenAccountsByOwner(owner.publicKey, {
        programId: TOKEN_PROGRAM_ID,
      }),
      connection.getTokenAccountsByOwner(owner.publicKey, {
        programId: TOKEN_2022_PROGRAM_ID,
      }),
    ])

    return parseTokenAccountResp({
      owner: owner.publicKey,
      solAccountResp,
      tokenAccountResp: {
        context: tokenAccountResp.context,
        value: [...tokenAccountResp.value, ...token2022Req.value],
      },
    })
  } catch (error) {
    console.error('Error fetching token account data:', error)
    throw new Error('Failed to fetch token account data')
  }
}

export const swap = async (tokenAddress: string, amount: number) => {
  try {
    const [isInputSol, isOutputSol] = [
      inputMint === NATIVE_MINT.toBase58(),
      tokenAddress === NATIVE_MINT.toBase58(),
    ]

    const { tokenAccounts } = await fetchTokenAccountData()

    const inputTokenAcc = tokenAccounts.find(
      a => a.mint.toBase58() === inputMint
    )?.publicKey
    const outputTokenAcc = tokenAccounts.find(
      a => a.mint.toBase58() === tokenAddress
    )?.publicKey

    if (!inputTokenAcc || !outputTokenAcc) {
      throw new Error('Input or output token account not found')
    }

    const { data: priorityFeeData } = await axios.get<{
      id: string
      success: boolean
      data: { default: { vh: number; h: number; m: number } }
    }>(`${API_URLS.BASE_HOST}${API_URLS.PRIORITY_FEE}`)

    const { data: swapResponse } = await axios.get(
      `${API_URLS.SWAP_HOST}/compute/swap-base-in`,
      {
        params: {
          inputMint,
          outputMint: tokenAddress,
          amount,
          slippageBps: slippage * 100,
          txVersion,
        },
      }
    )

    console.log('Swap computation response:', swapResponse)

    const { data: swapTransactions } = await axios.post<{
      id: string
      version: string
      success: boolean
      data: { transaction: string }[]
    }>(`${API_URLS.SWAP_HOST}/transaction/swap-base-in`, {
      computeUnitPriceMicroLamports: String(priorityFeeData.data.default.h),
      swapResponse,
      TxVersion: txVersion,
      wallet: owner.publicKey.toBase58(),
      wrapSol: isInputSol,
      unwrapSol: isOutputSol,
      inputAccount: isInputSol ? undefined : inputTokenAcc.toBase58(),
      outputAccount: isOutputSol ? undefined : outputTokenAcc.toBase58(),
    })

    console.log('Swap transactions:', swapTransactions)

    const allTxBuf = swapTransactions.data.map(tx =>
      Buffer.from(tx.transaction, 'base64')
    )
    const allTransactions = allTxBuf.map(txBuf =>
      isV0Tx ? VersionedTransaction.deserialize(txBuf) : Transaction.from(txBuf)
    )

    console.log(`Total ${allTransactions.length} transactions to process`)

    for (let idx = 0; idx < allTransactions.length; idx++) {
      const tx = allTransactions[idx]
      console.log(`Processing transaction ${idx + 1}...`)

      if (!isV0Tx) {
        const transaction = tx as Transaction
        transaction.sign(owner)
        const txId = await sendAndConfirmTransaction(
          connection,
          transaction,
          [owner],
          { skipPreflight: true }
        )
        console.log(`Transaction ${idx + 1} confirmed, txId: ${txId}`)
      } else {
        const transaction = tx as VersionedTransaction
        transaction.sign([owner])
        const txId = await connection.sendTransaction(transaction, {
          skipPreflight: true,
        })
        const { lastValidBlockHeight, blockhash } =
          await connection.getLatestBlockhash({
            commitment: 'finalized',
          })
        console.log(`Transaction ${idx + 1} sent, txId: ${txId}`)
        await connection.confirmTransaction(
          {
            blockhash,
            lastValidBlockHeight,
            signature: txId,
          },
          'confirmed'
        )
        console.log(`Transaction ${idx + 1} confirmed`)
      }
    }

    console.log('Swap completed successfully')
  } catch (error) {
    console.error('Error during swap operation:', error)
    throw new Error('Swap operation failed')
  }
}

const retry = async <T>(
  operation: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> => {
  try {
    return await operation()
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying operation. Attempts left: ${retries}`)
      await new Promise(resolve => setTimeout(resolve, delay))
      return retry(operation, retries - 1, delay * 2)
    }
    throw error
  }
}

export const performSwap = async (tokenAddress: string, amount: number) => {
  try {
    await retry(() => swap(tokenAddress, amount))
    console.log('Swap performed successfully')
  } catch (error) {
    console.error('Failed to perform swap after multiple attempts:', error)
  }
}
