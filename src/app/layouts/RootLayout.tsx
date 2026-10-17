import { Footer } from './Footer'
import { Header } from './Header'
import { Main } from './Main'

export function RootLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <Main />
      <Footer />
    </div>
  )
}
