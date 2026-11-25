import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { VisualAiAssistant } from './components/VisualAiAssistant';
import { HomePage } from './pages/HomePage';
import { CartCheckoutPage } from './pages/CartCheckoutPage';
import { PoliciesPage } from './pages/PoliciesPage';
import { SignupPage } from './pages/SignupPage';
import { StaffLoginPage } from './pages/StaffLoginPage';
import { StaffPortalPlaceholder } from './pages/StaffPortalPlaceholder';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/cart" element={<CartCheckoutPage />} />
              <Route path="/policies" element={<PoliciesPage />} />
              <Route path="/signup" element={<SignupPage />} />
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
          <VisualAiAssistant />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
