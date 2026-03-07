import './globals.css'
export const metadata = { title: 'Voca', description: 'AI voice note summarizer' }
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Outfit:wght@300;400;500&display=swap" rel="stylesheet"/>
      </head>
      <body>{children}</body>
    </html>
  )
}