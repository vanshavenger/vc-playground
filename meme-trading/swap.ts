import bs58 from 'bs58'
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from '@solana/web3.js'
import { NATIVE_MINT, getAssociatedTokenAddress } from '@solana/spl-token'
import axios from 'axios'
import { API_URLS } from '@raydium-io/raydium-sdk-v2'

const isV0Tx = true
const connection = new Connection(process.env.RPC_URL!, 'confirmed')
const owner = Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY!))
const slippage = 5

export async function swap(tokenAddress: string, amount: number) {
  const { data } = await axios.get<{
    id: string
    success: boolean
    data: { default: { vh: number; h: number; m: number } }
  }>(`${API_URLS.BASE_HOST}${API_URLS.PRIORITY_FEE}`)

  const { data: swapResponse } = await axios.get(
    `${
      API_URLS.SWAP_HOST
    }/compute/swap-base-in?inputMint=${NATIVE_MINT}&outputMint=${tokenAddress}&amount=${amount}&slippageBps=${
      slippage * 100
    }&txVersion=V0`
  )

  const { data: swapTransactions } = await axios.post<{
    id: string
    version: string
    success: boolean
    data: { transaction: string }[]
  }>(`${API_URLS.SWAP_HOST}/transaction/swap-base-in`, {
    computeUnitPriceMicroLamports: String(data.data.default.h),
    swapResponse,
    txVersion: 'V0',
    wallet: owner.publicKey.toBase58(),
    wrapSol: true,
    unwrapSol: false,
  })

  const ata = await getAssociatedTokenAddress(
    new PublicKey(tokenAddress),
    owner.publicKey
  )

  console.log({
    computeUnitPriceMicroLamports: String(data.data.default.h),
    swapResponse,
    txVersion: 'V0',
    wallet: owner.publicKey.toBase58(),
    wrapSol: true,
    unwrapSol: false,
  })
  console.log(swapTransactions)

  const allTxBuf = swapTransactions.data.map(tx =>
    Buffer.from(tx.transaction, 'base64')
  )
  const allTransactions = allTxBuf.map(txBuf =>
    isV0Tx ? VersionedTransaction.deserialize(txBuf) : Transaction.from(txBuf)
  )

  let idx = 0
  for (const tx of allTransactions) {
    idx++
    const transaction = tx as VersionedTransaction
    transaction.sign([owner])

    const txId = await connection.sendTransaction(tx as VersionedTransaction, {
      skipPreflight: true,
    })
    console.log('after sending txn')
    const { lastValidBlockHeight, blockhash } =
      await connection.getLatestBlockhash({
        commitment: 'finalized',
      })
    console.log(`${idx} transaction sending..., txId: ${txId}`)
    await connection.confirmTransaction(
      {
        blockhash,
        lastValidBlockHeight,
        signature: txId,
      },
      'confirmed'
    )
    console.log(`${idx} transaction confirmed`)
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
