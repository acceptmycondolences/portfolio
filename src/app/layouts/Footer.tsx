import { Container } from '~/shared/ui'

export function Footer() {
  return (
    <footer className="py-6">
      <Container>
        <p className="text-center text-sm text-balance text-zinc-800 dark:text-zinc-400">
          &copy; {new Date().getFullYear()} Alibek Allanazarov. All Rights Reserved.
        </p>
      </Container>
    </footer>
  )
}
