import Sidebar from './Sidebar'

export default function PageWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <Sidebar />
      <main className="md:ml-64 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-16 md:pt-8">
          {children}
        </div>
      </main>
    </div>
  )
}
