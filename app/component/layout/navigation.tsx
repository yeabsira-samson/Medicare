"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../hooks/userAuth";
import { useRouter } from "next/navigation";

export default function Navigation() {
  const { isLoggedIn, user, logout, refreshAuth } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleAuthChange = () => {
      refreshAuth();
    };
    
    window.addEventListener('auth-change', handleAuthChange);
    
    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, [refreshAuth]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      setIsDropdownOpen(false);
      
      router.push('/');
      
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <nav className="top-0 w-full z-50 bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-6 py-2 flex justify-between items-center">
        <div className="text-lg font-semibold text-blue-600">
          <Link href="/" className="hover:text-blue-700 transition">
            Medicare
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {!isLoggedIn ? (
            <>
              <Link
                href="/login"
                className="px-3 py-1 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition text-sm"
              >
                Log In
              </Link>
            </>
          ) : (
            <>
              
              <Link
                href="/favorite"
                className="px-3 py-1 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition text-sm"
              >
                Favorite
              </Link>
              
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  disabled={isLoggingOut}
                  className="flex items-center gap-2 px-3 py-1 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition text-sm disabled:opacity-50"
                >
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-semibold">
                    {user?.firstName?.[0] || user?.email?.[0] || "U"}
                  </span>
                  <span className="hidden sm:inline">
                    {user?.firstName || user?.email?.split("@")[0] || "User"}
                  </span>
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 border border-gray-200">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs text-gray-500">Signed in as</p>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user?.email || "User"}
                      </p>
                    </div>
                    
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoggingOut ? "Logging out..." : "Log Out"}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}