import { Container } from '~/shared/ui'

const CURRENT_YEAR = new Date().getFullYear()

export function Footer() {
  return (
    <footer className="py-6">
      <Container>
        <p className="text-center text-sm text-balance text-zinc-800 dark:text-zinc-400">
          &copy; {CURRENT_YEAR} Allanazarov Alibek. All Rights Reserved.
        </p>
      </Container>
    </footer>
  )
}
