import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import { AppShell } from './components/AppShell'

export const metadata = {
  title: 'HR AI Platform',
  description: 'AI-powered HR management platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
