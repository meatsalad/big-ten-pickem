import { useAuth } from './context/AuthContext.jsx';
import { Routes, Route, Link as RouterLink, Outlet } from 'react-router-dom';
import Auth from './components/Auth.jsx';
import GameList from './components/GameList.jsx';
import Leaderboard from './components/Leaderboard.jsx';
import Stats from './components/Stats.jsx';
import Rules from './components/Rules.jsx';
import CompactStats from './components/CompactStats.jsx'; // Import the new compact stats component

import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Spacer,
  Link,
} from '@chakra-ui/react';

// This is our main application shell for logged-in users
function AppShell() {
  const { user, signOut } = useAuth();

  return (
    <Box>
      <Flex as="nav" bg="gray.800" color="white" p={4} align="center">
        <Heading size="md" mr={8}>
          Big Ten Pick 'em
        </Heading>
        <Link as={RouterLink} to="/" mr={4}>
          Leaderboard
        </Link>
        <Link as={RouterLink} to="/picks" mr={4}>
          Picks
        </Link>
        <Link as={RouterLink} to="/stats" mr={4}>
          Stats
        </Link>
        <Link as={RouterLink} to="/rules" mr={4}>
          Rules
        </Link>

        {/* The new compact stats component is placed here */}
        <CompactStats />

        <Spacer />
        <Box mr={4}>Welcome, {user?.email}</Box>
        <Button colorScheme="teal" onClick={signOut}>
          Sign Out
        </Button>
      </Flex>
      <Container maxW="container.lg" py={8}>
        {/* Child routes will be rendered here */}
        <Outlet />
      </Container>
    </Box>
  );
}

function App() {
  const { session } = useAuth();

  return (
    <Routes>
      {session ? (
        // If logged in, render the AppShell, which contains nested routes
        <Route path="/" element={<AppShell />}>
          <Route index element={<Leaderboard />} /> {/* Default page at '/' */}
          <Route path="picks" element={<GameList />} />
          <Route path="stats" element={<Stats />} />
          <Route path="rules" element={<Rules />} />
        </Route>
      ) : (
        // If not logged in, render the Auth page for any URL
        <Route path="*" element={<Auth />} />
      )}
    </Routes>
  );
}

export default App;
