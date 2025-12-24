import AppLayout from '@/components/AppLayout'
import { FossilCacheProvider } from '@/contexts/FossilCacheContext'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <FossilCacheProvider>
      <AppLayout>{children}</AppLayout>
    </FossilCacheProvider>
  )
}

