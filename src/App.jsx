import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePlaceholder } from './pages/HomePlaceholder';
import { StaffLoginPage } from './pages/StaffLoginPage';
import { StaffPortalPlaceholder } from './pages/StaffPortalPlaceholder';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePlaceholder />} />
            <Route path="/staff/login" element={<StaffLoginPage />} />
            <Route
              path="/staff"
              element={
                <ProtectedRoute allowedRoles={['front_desk', 'operations', 'admin']}>
                  <StaffPortalPlaceholder />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}
