import React, { useState } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import { Routes, Route, Link as RouterLink, Outlet, useLocation } from 'react-router-dom';
import Auth from './components/Auth.jsx';
import GameList from './components/GameList.jsx';
import Leaderboard from './components/Leaderboard.jsx';
import Stats from './components/Stats.jsx';
import Rules from './components/Rules.jsx';
import Account from './components/Account.jsx';
import CompactStats from './components/CompactStats.jsx';
import TopBar from './components/TopBar.jsx'; // <-- Import the new TopBar

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

import {
  FaTrophy,
  FaClipboardList,
  FaChartBar,
  FaBook,
  FaUserCog,
  FaSignOutAlt,
  FaChevronLeft,
  FaChevronRight,
} from 'react-icons/fa';

// A reusable NavItem component for our sidebar links
const NavItem = ({ icon, children, to, isCollapsed, ...rest }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Tooltip label={children} placement="right" isDisabled={!isCollapsed}>
      <Link
        as={RouterLink}
        to={to}
        w="full"
        bg={isActive ? 'whiteAlpha.400' : 'transparent'}
        _hover={{ bg: 'whiteAlpha.200' }}
        p={3}
        borderRadius="md"
        {...rest}
      >
        <Flex align="center">
          <Box as={icon} fontSize="xl" />
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
    // The main container is now a vertical Flexbox
    <Flex h="100vh" direction="column" bg="gray.50">
      <TopBar /> {/* <-- The new top bar is added here */}
      
      {/* This Flex container holds the sidebar and main content */}
      <Flex flex="1" overflow="hidden">
        {/* Sidebar Navigation */}
        <Flex
          as="nav"
          __css={navStyles}
          w={isCollapsed ? '80px' : '250px'}
          h="full"
          direction="column"
          p={4}
          transition="width 0.2s"
        >
          <VStack spacing={4} align="stretch" flex="1">
            <Heading size="md" mb={4}>
              {isCollapsed ? "B10" : "Big Ten Pick 'em"}
            </Heading>
            <NavItem to="/" icon={FaTrophy} isCollapsed={isCollapsed}>Leaderboard</NavItem>
            <NavItem to="/picks" icon={FaClipboardList} isCollapsed={isCollapsed}>Picks</NavItem>
            <NavItem to="/stats" icon={FaChartBar} isCollapsed={isCollapsed}>Stats</NavItem>
            <NavItem to="/rules" icon={FaBook} isCollapsed={isCollapsed}>Rules</NavItem>
            <NavItem to="/account" icon={FaUserCog} isCollapsed={isCollapsed}>Account</NavItem>
          </VStack>

          {/* User Info & Logout at the bottom of the sidebar */}
          <VStack spacing={4} align="stretch">
            <Divider />
            <HStack>
              <Avatar
                size="sm"
                name={profile?.username || user?.email}
                src={profile?.avatar_url}
              />
              {!isCollapsed && <Text fontSize="sm">{profile?.username || user?.email}</Text>}
            </HStack>
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
          <IconButton
            icon={isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label="Toggle Sidebar"
            mb={4}
            borderRadius="full"
          />
          <Outlet />
        </Box>
      </Flex>
    </Flex>
  );
}

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
          <Route path="rules" element={<Rules />} />
          <Route path="account" element={<Account />} />
        </Route>
      ) : (
        <Route path="*" element={<Auth />} />
      )}
    </Routes>
  );
}

export default App;
