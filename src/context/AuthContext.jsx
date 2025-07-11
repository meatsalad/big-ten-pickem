import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';
import { useToast } from '@chakra-ui/react';
import { STANDARD_MESSAGES, SMACK_TALK_MESSAGES } from '../lib/messages';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // This effect handles setting the user session from Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setSession(session);
          setUser(session?.user ?? null);
        }
      );

      return () => {
        subscription?.unsubscribe();
      };
    });
  }, []);

  // This separate effect handles fetching the user's profile when they log in
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

  // --- NEW, DEDICATED EFFECT FOR THE WELCOME MESSAGE ---
  useEffect(() => {
    // Only run if we have a user and haven't shown the message this session
    if (user && !sessionStorage.getItem('welcomeMessageShown')) {
      const showWelcomeMessage = async () => {
        try {
          const { data: setting } = await supabase
            .from('settings')
            .select('is_enabled')
            .eq('setting_name', 'smack_talk_mode')
            .single();
          
          const messageList = setting?.is_enabled ? SMACK_TALK_MESSAGES : STANDARD_MESSAGES;
          const message = messageList[Math.floor(Math.random() * messageList.length)];
          
          toast({
            title: message,
            status: 'info',
            duration: 5000,
            isClosable: true,
            position: 'top',
          });

          sessionStorage.setItem('welcomeMessageShown', 'true');
        } catch (error) {
          console.error("Could not display welcome message:", error);
        }
      };
      
      showWelcomeMessage();
    }
  }, [user, toast]); // This effect runs when the user object is first populated


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
    signOut: () => {
      // Clear the session flag on sign out
      sessionStorage.removeItem('welcomeMessageShown');
      supabase.auth.signOut();
    },
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