import { useContext } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Interview from "./pages/Interview";
import CompanyInterview from "./pages/interview/Company";
import ResumeInterview from "./pages/interview/Resume";
import Community from "./pages/Community";

import TopicSelector from "./pages/practice/TopicSelector";
import ConceptLearning from "./pages/practice/ConceptLearning";
import MCQTest from "./pages/practice/MCQTest";
import AIChat from "./pages/practice/AIChat";

function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-500">
        Authenticating...
      </div>
    );
  }

  return user ? children : <Navigate to="/" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/interview"
          element={
            <ProtectedRoute>
              <Interview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/practice"
          element={
            <ProtectedRoute>
              <TopicSelector />
            </ProtectedRoute>
          }
        />
        <Route
          path="/practice/learn"
          element={
            <ProtectedRoute>
              <ConceptLearning />
            </ProtectedRoute>
          }
        />
        <Route
          path="/practice/mcq"
          element={
            <ProtectedRoute>
              <MCQTest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/practice/chat"
          element={
            <ProtectedRoute>
              <AIChat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/company-interview"
          element={
            <ProtectedRoute>
              <CompanyInterview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resume"
          element={
            <ProtectedRoute>
              <ResumeInterview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/community"
          element={
            <ProtectedRoute>
              <Community />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
