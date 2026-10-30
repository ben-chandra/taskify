import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { UserSwitcher } from './components/UserSwitcher/UserSwitcher';
import { useCurrentUserId } from './state/useCurrentUserId';
import { ProjectListPage } from './pages/ProjectListPage';
import { ProjectBoardPage } from './pages/ProjectBoardPage';
import './App.css';

const queryClient = new QueryClient();

function AppShell() {
  const currentUserId = useCurrentUserId();

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Taskify</h1>
        <UserSwitcher />
      </header>
      <main>
        {currentUserId ? (
          <Routes>
            <Route path="/" element={<ProjectListPage />} />
            <Route path="/projects/:projectId" element={<ProjectBoardPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        ) : (
          <p>Select a user above to get started.</p>
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
