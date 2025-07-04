import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AuthProvider, useAuth } from './context/AuthContext.jsx'; // <-- Import useAuth here
import { SeasonProvider } from './context/SeasonContext.jsx';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { BrowserRouter } from 'react-router-dom';
import { BIG_TEN_TEAMS } from './lib/teams.js';

// This new component creates the dynamic theme
const ThemedApp = () => {
  // Get the user's profile from our auth context
  const { profile } = useAuth();

  // Find the team object that matches the user's favorite team
  const selectedTeam = BIG_TEN_TEAMS.find(
    (team) => team.name === profile?.favorite_team
  );

  // Define a default theme
  let themeConfig = {
    colors: {
      brand: {
        500: '#008cfa', // Default blue
      },
    },
    components: {
      Navbar: { // We're creating a custom component variant called "Navbar"
        baseStyle: {
          bg: 'gray.800', // Default background
          color: 'white',   // Default text color
        },
      },
    },
  };

  // If a favorite team is selected, override the defaults
  if (selectedTeam) {
    themeConfig.colors.brand = {
      500: selectedTeam.colors.primary,
    };
    // Override the navbar style with team colors
    themeConfig.components.Navbar.baseStyle = {
      bg: selectedTeam.colors.primary,
      color: selectedTeam.colors.secondary,
    };
  }

  const theme = extendTheme(themeConfig);

  return (
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* AuthProvider now wraps ThemedApp so it has access to the profile */}
      <AuthProvider>
        <SeasonProvider>
          <ThemedApp />
        </SeasonProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
