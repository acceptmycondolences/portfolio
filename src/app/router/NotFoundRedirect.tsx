import { Navigate } from '@tanstack/react-router'

export function NotFoundRedirect() {
  return <Navigate replace to="/" />
}
