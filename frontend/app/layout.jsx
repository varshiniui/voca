import './globals.css'

export const metadata = {
  title: 'Voca — Voice Note Summarizer',
  description: 'Speak your mind. Voca organises it into clear, structured notes.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>{children}</body>
    </html>
  )
}