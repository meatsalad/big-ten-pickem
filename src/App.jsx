import React, { useState } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import { Routes, Route, Link as RouterLink, Outlet, useLocation, Navigate } from 'react-router-dom';
import Auth from './components/Auth.jsx';
import GameList from './components/GameList.jsx';
import Leaderboard from './components/Leaderboard.jsx';
import Stats from './components/Stats.jsx';
import Rules from './components/Rules.jsx';
import Account from './components/Account.jsx';
import TopBar from './components/TopBar.jsx';
import Profile from './components/Profile.jsx'; // <-- Was MyStats.jsx
import Admin from './components/Admin.jsx';
import OnlineUsers from './components/OnlineUsers.jsx';

import {
  Box,
  Button,
  Flex,
  Heading,
  Link,
  Avatar,
  HStack,
  Text,
  useStyleConfig,
  VStack,
  IconButton,
  Divider,
  Tooltip,
} from '@chakra-ui/react';

// Import icons
import {
  FaTrophy,
  FaClipboardList,
  FaChartBar,
  FaBook,
  FaSignOutAlt,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaIdBadge,
  FaShieldAlt,
} from 'react-icons/fa';

// A reusable NavItem component for our sidebar links
const NavItem = ({ icon, children, to, isCollapsed }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Tooltip label={children} placement="right" isDisabled={!isCollapsed}>
      <Link
        as={RouterLink}
        to={to}
        w="full"
        bg={isActive ? 'whiteAlpha.300' : 'transparent'}
        _hover={{ bg: 'whiteAlpha.100' }}
        p={3}
        borderRadius="md"
      >
        <Flex align="center">
          <Box as={icon} fontSize="xl" mx={isCollapsed ? 'auto' : '0'} />
          {!isCollapsed && (
            <Text ml={4} fontSize="md">
              {children}
            </Text>
          )}
        </Flex>
      </Link>
    </Tooltip>
  );
};

// This is our main application shell with the new layout
function AppShell() {
  const { user, profile, signOut } = useAuth();
  const navStyles = useStyleConfig("Navbar");
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <Flex h="100vh" direction="column" bg="gray.50">
      <TopBar />
      
      <Flex flex="1" overflow="hidden">
        {/* Sidebar Navigation */}
        <Flex
          as="nav"
          __css={navStyles}
          w={isCollapsed ? '80px' : '260px'}
          h="full"
          direction="column"
          p={4}
          transition="width 0.2s ease-in-out"
        >
          {/* Header and Toggle Button */}
          <Flex align="center" justify="space-between" mb={6}>
            {!isCollapsed && <Heading size="md" whiteSpace="nowrap">Big Ten Pick 'em</Heading>}
            <IconButton
              icon={isCollapsed ? <FaAngleDoubleRight /> : <FaAngleDoubleLeft />}
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-label="Toggle Sidebar"
              variant="ghost"
              color="white"
              _hover={{ bg: 'whiteAlpha.200' }}
              isRound
            />
          </Flex>

          {/* Navigation Links */}
          <VStack spacing={2} align="stretch" flex="1">
            <NavItem to="/" icon={FaTrophy} isCollapsed={isCollapsed}>Leaderboard</NavItem>
            <NavItem to="/picks" icon={FaClipboardList} isCollapsed={isCollapsed}>Picks</NavItem>
            <NavItem to="/stats" icon={FaChartBar} isCollapsed={isCollapsed}>League Stats</NavItem>
            {/* Link now points to the user's own profile page */}
            <NavItem to={`/profile/${user.id}`} icon={FaIdBadge} isCollapsed={isCollapsed}>My Stats</NavItem>
            <NavItem to="/rules" icon={FaBook} isCollapsed={isCollapsed}>Rules</NavItem>
            
            {profile?.role === 'commissioner' && (
              <NavItem to="/admin" icon={FaShieldAlt} isCollapsed={isCollapsed}>Admin</NavItem>
            )}
          </VStack>

          {/* User Info & Logout at the bottom */}
          <VStack spacing={3} align="stretch">
            {!isCollapsed && <OnlineUsers />}
            <Divider borderColor="whiteAlpha.400" />
            <Link
              as={RouterLink}
              to="/account"
              _hover={{ textDecoration: 'none', bg: 'whiteAlpha.100' }}
              p={2}
              borderRadius="md"
            >
              <HStack>
                <Avatar
                  size="sm"
                  name={profile?.username || user?.email}
                  src={profile?.avatar_url}
                />
                {!isCollapsed && <Text fontSize="sm" noOfLines={1}>{profile?.username || user?.email}</Text>}
              </HStack>
            </Link>
            <Button
              leftIcon={<FaSignOutAlt />}
              colorScheme="brand"
              onClick={signOut}
              justifyContent={isCollapsed ? 'center' : 'flex-start'}
            >
              {!isCollapsed && 'Sign Out'}
            </Button>
          </VStack>
        </Flex>

        {/* Main Content Area */}
        <Box flex="1" p={8} overflowY="auto">
          <Outlet />
        </Box>
      </Flex>
    </Flex>
  );
}

// --- New Protected Route Component ---
const CommissionerRoute = ({ children }) => {
    const { profile } = useAuth();
    if (profile?.role !== 'commissioner') {
        return <Navigate to="/" replace />;
    }
    return children;
};


// The main App component that handles routing logic
function App() {
  const { session } = useAuth();

  return (
    <Routes>
      {session ? (
        <Route path="/" element={<AppShell />}>
          <Route index element={<Leaderboard />} />
          <Route path="picks" element={<GameList />} />
          <Route path="stats" element={<Stats />} />
          {/* Add the new dynamic routes */}
          <Route path="profile/:userId" element={<Profile />} />
          {/* Redirect from old path to new path */}
          <Route path="my-stats" element={<Navigate to={`/profile/${session.user.id}`} replace />} />
          <Route path="rules" element={<Rules />} />
          <Route path="account" element={<Account />} />
          <Route 
            path="admin" 
            element={
              <CommissionerRoute>
                <Admin />
              </CommissionerRoute>
            } 
          />
        </Route>
      ) : (
        <Route path="*" element={<Auth />} />
      )}
    </Routes>
  );
}

export default App;
