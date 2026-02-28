import PageWrapper from '@/components/layout/PageWrapper'
import UsernameGate from '@/components/UsernameGate'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <UsernameGate>
      <PageWrapper>{children}</PageWrapper>
    </UsernameGate>
  )
}
