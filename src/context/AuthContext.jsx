import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Initial check for the session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false); // <-- Crucially, set loading to false after the session is checked

      // 2. Set up the listener for future auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setSession(session);
          setUser(session?.user ?? null);
        }
      );

      // Cleanup the subscription when the component unmounts
      return () => {
        subscription?.unsubscribe();
      };
    });
  }, []);

  // 3. A separate effect to fetch the profile whenever the user object changes
  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('username, avatar_url, favorite_team, role')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          setProfile(data || null);
        });
    } else {
      setProfile(null);
    }
  }, [user]);

  // This function is still useful for manual refreshes, like on the Account page
  const refreshProfile = async () => {
    if (user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username, avatar_url, favorite_team, role')
        .eq('id', user.id)
        .single();
      setProfile(profileData || null);
    }
  };

  const value = {
    session,
    user,
    profile,
    refreshProfile,
    signOut: () => supabase.auth.signOut(),
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
