import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [staffProfile, setStaffProfile] = useState(null);
  const [activeOperator, setActiveOperator] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadStaffProfile(userId) {
    if (!userId) {
      setStaffProfile(null);
      return;
    }
    const { data, error } = await supabase
      .from('staff_profiles')
      .select('id, full_name, role, is_active')
      .eq('id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      setStaffProfile(null);
      return;
    }
    setStaffProfile(data || null);
  }

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session || null);
      await loadStaffProfile(data.session?.user?.id);
      if (mounted) setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        setSession(nextSession || null);
        await loadStaffProfile(nextSession?.user?.id);
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function signInStaff(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
    await loadStaffProfile(data.user?.id);
    return data;
  }

  async function signOutStaff() {
    setActiveOperator(null);
    await supabase.auth.signOut();
    setStaffProfile(null);
  }

  async function verifyEmployeePin(pin) {
    const { data, error } = await supabase.rpc('verify_employee_pin', {
      pin_input: pin.trim(),
    });
    if (error) throw error;
    const match = Array.isArray(data) ? data[0] : data;
    if (!match) {
      throw new Error('Invalid Employee Code');
    }
    setActiveOperator(match);
    return match;
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        staffProfile,
        activeOperator,
        setActiveOperator,
        loading,
        signInStaff,
        signOutStaff,
        verifyEmployeePin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
