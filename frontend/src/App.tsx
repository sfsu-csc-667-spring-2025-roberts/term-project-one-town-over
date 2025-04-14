import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Lobby from "./pages/Lobby";
import GameRoom from "./pages/GameRoom";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

// Components
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

const App: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/lobby" /> : <Login />}
          />
          <Route
            path="/register"
            element={isAuthenticated ? <Navigate to="/lobby" /> : <Register />}
          />

          {/* Protected routes */}
          <Route path="/" element={<Navigate to="/lobby" />} />
          <Route
            path="/lobby"
            element={
              <ProtectedRoute>
                <Lobby />
              </ProtectedRoute>
            }
          />
          <Route
            path="/game/:gameId"
            element={
              <ProtectedRoute>
                <GameRoom />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="bg-gray-800 text-white p-4 text-center">
        <p>
          &copy; {new Date().getFullYear()} Team One Town Over - Texas Hold'em
        </p>
      </footer>
    </div>
  );
};

export default App;
