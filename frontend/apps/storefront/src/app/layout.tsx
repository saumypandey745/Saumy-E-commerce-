// src/app/layout.tsx
import './globals.css';
import FloatingChatWidget from '@/components/FloatingChatWidget';
import { ThemeProvider } from '@/components/ThemeProvider';
import GlobalLayoutWrapper from '@/components/GlobalLayoutWrapper';
import GoogleAuthProviderWrapper from '@/components/GoogleAuthProviderWrapper';

export const metadata = {
  title: 'Saumy E-commerce',
  description: 'Premium ecommerce storefront with modern UI and full‑stack features.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans bg-white dark:bg-[#0f172a] text-gray-900 dark:text-gray-100 min-h-screen flex flex-col transition-colors duration-300`}> 
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <GoogleAuthProviderWrapper clientId={googleClientId}>
              <GlobalLayoutWrapper>
                {children}
              </GlobalLayoutWrapper>
              <FloatingChatWidget />
            </GoogleAuthProviderWrapper>
          </ThemeProvider>
      </body>
    </html>
  );
}
