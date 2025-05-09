import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/auth/login");
  };

  return (
    <nav className="text-white shadow-md bg-primary">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0">
              <span className="text-xl font-bold font-display">
                Texas Hold'em
              </span>
            </Link>
            <div className="hidden md:block">
              <div className="flex items-baseline ml-10 space-x-4">
                {isAuthenticated && (
                  <>
                    <Link
                      to="/lobby"
                      className="px-3 py-2 text-sm font-medium rounded-md hover:bg-primary-dark"
                    >
                      Lobby
                    </Link>
                    <Link
                      to="/profile"
                      className="px-3 py-2 text-sm font-medium rounded-md hover:bg-primary-dark"
                    >
                      Profile
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="flex items-center ml-4 md:ml-6">
              {isAuthenticated ? (
                <div className="flex items-center">
                  <span className="mr-4">{user?.email}</span>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-2 text-sm font-medium rounded-md bg-primary-dark hover:bg-primary-light"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex space-x-4">
                  <Link
                    to="/auth/login"
                    className="px-3 py-2 text-sm font-medium rounded-md hover:bg-primary-dark"
                  >
                    Login
                  </Link>
                  <Link
                    to="/auth/register"
                    className="px-3 py-2 text-sm font-medium rounded-md bg-primary-dark hover:bg-primary-light"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
          <div className="flex -mr-2 md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 text-white rounded-md hover:bg-primary-dark focus:outline-none"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {!isMenuOpen ? (
                <svg
                  className="block w-6 h-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                <svg
                  className="block w-6 h-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {isAuthenticated && (
              <>
                <Link
                  to="/lobby"
                  className="block px-3 py-2 text-base font-medium rounded-md hover:bg-primary-dark"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Lobby
                </Link>
                <Link
                  to="/profile"
                  className="block px-3 py-2 text-base font-medium rounded-md hover:bg-primary-dark"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </Link>
              </>
            )}
            {isAuthenticated ? (
              <div className="pt-4 pb-3 border-t border-primary-light">
                <div className="flex items-center px-5">
                  <div className="ml-3">
                    <div className="text-base font-medium">{user?.email}</div>
                  </div>
                </div>
                <div className="px-2 mt-3 space-y-1">
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full px-3 py-2 text-base font-medium text-left rounded-md hover:bg-primary-dark"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-4 pb-3 border-t border-primary-light">
                <Link
                  to="/auth/login"
                  className="block px-3 py-2 text-base font-medium rounded-md hover:bg-primary-dark"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/auth/register"
                  className="block px-3 py-2 text-base font-medium rounded-md hover:bg-primary-dark"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
