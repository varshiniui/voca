import { Cormorant_Garamond, Outfit } from 'next/font/google'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300','400','500'],
  style: ['normal','italic'],
  variable: '--font-display',
})
const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300','400','500'],
  variable: '--font-body',
})

export const metadata = {
  title: 'Voca',
  description: 'AI voice note summarizer',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${outfit.variable}`}>
      <body>{children}</body>
    </html>
  )
}