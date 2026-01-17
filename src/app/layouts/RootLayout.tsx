import { Footer, Header } from '~/app/layouts'

import { Main } from '~/widgets/main'

export function RootLayouts() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <Main />
      <Footer />
    </div>
  )
}
