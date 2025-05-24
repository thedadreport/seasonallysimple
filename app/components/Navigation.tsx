'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const isLoggedIn = status === 'authenticated';
  const userInitial = session?.user?.name?.charAt(0) || 'U';

  const isActive = (path: string) => {
    return pathname === path;
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    if (isUserMenuOpen) setIsUserMenuOpen(false);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
    if (isMenuOpen) setIsMenuOpen(false);
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Create a ref on the fly to check if the click was outside the user menu
      const userMenuRef = document.querySelector('.user-menu-container');
      if (userMenuRef && !userMenuRef.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  return (
    <nav className="bg-white shadow-sm print:hidden">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="text-2xl font-serif font-bold text-sage">
            Seasonally Simple
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className={`font-medium ${isActive('/') ? 'text-sage' : 'text-navy hover:text-sage'}`}
            >
              Home
            </Link>
            <Link 
              href="/recipes" 
              className={`font-medium ${isActive('/recipes') ? 'text-sage' : 'text-navy hover:text-sage'}`}
            >
              Recipes
            </Link>
            <Link 
              href="/recipe-generator" 
              className={`font-medium ${isActive('/recipe-generator') ? 'text-sage' : 'text-navy hover:text-sage'}`}
            >
              Generate Recipe
            </Link>
            <Link 
              href="/meal-plan" 
              className={`font-medium ${isActive('/meal-plan') ? 'text-sage' : 'text-navy hover:text-sage'}`}
            >
              Meal Plan
            </Link>
            <Link 
              href="/shopping-list" 
              className={`font-medium ${isActive('/shopping-list') ? 'text-sage' : 'text-navy hover:text-sage'}`}
            >
              Shopping List
            </Link>
          </div>

          {/* User Menu & Mobile Menu Toggle */}
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <div className="relative user-menu-container">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleUserMenu();
                  }}
                  className="flex items-center focus:outline-none"
                  aria-expanded={isUserMenuOpen}
                  aria-label="User menu"
                >
                  {session.user.image ? (
                    <img 
                      src={session.user.image} 
                      alt={session.user.name || 'User'} 
                      className="w-8 h-8 rounded-full object-cover" 
                    />
                  ) : (
                    <div className="w-8 h-8 bg-sage text-white rounded-full flex items-center justify-center">
                      <span className="font-medium">{userInitial}</span>
                    </div>
                  )}
                </button>

                {/* User Dropdown Menu */}
                {isUserMenuOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                  >
                    <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                      Signed in as<br />
                      <span className="font-medium">{session.user.email}</span>
                    </div>
                    <Link 
                      href="/profile" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Your Profile
                    </Link>
                    <Link 
                      href="/saved-recipes" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Saved Recipes
                    </Link>
                    <Link 
                      href="/upload-recipe" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Upload Recipe
                    </Link>
                    <Link 
                      href="/settings" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Settings
                    </Link>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden md:block text-navy hover:text-sage font-medium"
              >
                Log In
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className="md:hidden text-navy focus:outline-none"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="mt-4 pt-4 border-t border-gray-100 md:hidden">
            <div className="flex flex-col space-y-4">
              <Link
                href="/"
                onClick={() => setIsMenuOpen(false)}
                className={`font-medium ${isActive('/') ? 'text-sage' : 'text-navy'}`}
              >
                Home
              </Link>
              <Link
                href="/recipes"
                onClick={() => setIsMenuOpen(false)}
                className={`font-medium ${isActive('/recipes') ? 'text-sage' : 'text-navy'}`}
              >
                Recipes
              </Link>
              <Link
                href="/recipe-generator"
                onClick={() => setIsMenuOpen(false)}
                className={`font-medium ${isActive('/recipe-generator') ? 'text-sage' : 'text-navy'}`}
              >
                Generate Recipe
              </Link>
              <Link
                href="/meal-plan"
                onClick={() => setIsMenuOpen(false)}
                className={`font-medium ${isActive('/meal-plan') ? 'text-sage' : 'text-navy'}`}
              >
                Meal Plan
              </Link>
              <Link
                href="/shopping-list"
                onClick={() => setIsMenuOpen(false)}
                className={`font-medium ${isActive('/shopping-list') ? 'text-sage' : 'text-navy'}`}
              >
                Shopping List
              </Link>
              {isLoggedIn && (
                <Link
                  href="/upload-recipe"
                  onClick={() => setIsMenuOpen(false)}
                  className={`font-medium ${isActive('/upload-recipe') ? 'text-sage' : 'text-navy'}`}
                >
                  Upload Recipe
                </Link>
              )}
              {isLoggedIn ? (
                <button
                  onClick={handleSignOut}
                  className="font-medium text-navy text-left"
                >
                  Sign Out
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="font-medium text-navy"
                >
                  Log In
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}