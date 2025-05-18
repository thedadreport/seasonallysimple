import './globals.css';
import type { Metadata } from 'next';
import Navigation from './components/Navigation';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Seasonally Simple',
  description: 'AI-powered seasonal recipe assistant that makes wholesome cooking simple for busy families',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600&family=Caveat:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <header>
              <Navigation />
            </header>
            <main className="flex-grow container mx-auto px-4 py-8">
              {children}
            </main>
            <footer className="bg-navy text-white py-8">
              <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-3 gap-8">
                  <div>
                    <h3 className="text-lg font-serif font-semibold mb-4">Seasonally Simple</h3>
                    <p className="text-sm text-gray-300 mb-4">
                      AI-powered seasonal recipe assistant that makes wholesome cooking simple for busy families.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-serif font-semibold mb-4">Quick Links</h3>
                    <ul className="space-y-2">
                      <li><a href="/" className="text-sm text-gray-300 hover:text-white">Home</a></li>
                      <li><a href="/recipes" className="text-sm text-gray-300 hover:text-white">Browse Recipes</a></li>
                      <li><a href="/recipe-generator" className="text-sm text-gray-300 hover:text-white">Generate Recipe</a></li>
                      <li><a href="/meal-plan" className="text-sm text-gray-300 hover:text-white">Meal Planning</a></li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-serif font-semibold mb-4">Legal</h3>
                    <ul className="space-y-2">
                      <li><a href="/terms" className="text-sm text-gray-300 hover:text-white">Terms of Service</a></li>
                      <li><a href="/privacy" className="text-sm text-gray-300 hover:text-white">Privacy Policy</a></li>
                      <li><a href="/cookies" className="text-sm text-gray-300 hover:text-white">Cookie Policy</a></li>
                    </ul>
                  </div>
                </div>
                <div className="border-t border-gray-700 mt-8 pt-8">
                  <p className="text-center text-sm">© {new Date().getFullYear()} Seasonally Simple. All rights reserved.</p>
                </div>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}