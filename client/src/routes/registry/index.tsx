import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/registry/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/registry/"!</div>
}
