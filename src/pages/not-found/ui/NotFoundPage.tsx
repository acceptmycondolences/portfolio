import { Navigate } from '@tanstack/react-router'

export function NotFoundPage() {
  return <Navigate replace to="/" />
}
