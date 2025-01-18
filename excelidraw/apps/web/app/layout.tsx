import Navigation from '../components/navigation'
import '@repo/ui/globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Excelidraw',
  description: 'A collaborative drawing app',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='en'>
      <body className={inter.className}>
        <Navigation />
        {children}
      </body>
    </html>
  )
}
