import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLeague } from '../context/LeagueContext'; // We'll need this to refresh the leagues
import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  Spinner,
  Alert,
  AlertIcon,
  Text,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';

export default function LeagueOnboarding() {
  const { session } = useAuth();
  const { refreshLeagues } = useLeague(); // Assuming you have a refresh function in your context
  const navigate = useNavigate();

  const [leagueName, setLeagueName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [newLeagueInfo, setNewLeagueInfo] = useState(null); // To store success data

  const handleCreateLeague = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!session) {
      setError('You must be logged in to create a league.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/create-league', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ leagueName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'An unknown error occurred.');
      }

      // Success!
      setNewLeagueInfo({ name: leagueName, inviteCode: data.inviteCode });
      await refreshLeagues(); // Refresh the global league list

    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formBg = useColorModeValue('white', 'gray.800');

  // If league is created, show the success message and invite code
  if (newLeagueInfo) {
    return (
      <Box maxW="md" mx="auto" mt={10} p={8} borderWidth={1} borderRadius={8} boxShadow="lg" bg={formBg}>
        <VStack spacing={4}>
          <Heading as="h2" size="lg">League Created!</Heading>
          <Text>Your league, "{newLeagueInfo.name}", has been successfully created.</Text>
          <Text>Share this invite code with your friends:</Text>
          <Box p={4} bg={useColorModeValue('gray.100', 'gray.700')} borderRadius="md" w="full" textAlign="center">
            <Text fontSize="2xl" fontWeight="bold" letterSpacing="widest">{newLeagueInfo.inviteCode}</Text>
          </Box>
          <Button colorScheme="brand" onClick={() => navigate('/')}>Go to Dashboard</Button>
        </VStack>
      </Box>
    );
  }

  // Otherwise, show the creation form
  return (
    <Box maxW="md" mx="auto" mt={10} p={8} borderWidth={1} borderRadius={8} boxShadow="lg" bg={formBg}>
      <form onSubmit={handleCreateLeague}>
        <VStack spacing={4}>
          <Heading as="h2" size="lg">Create a New League</Heading>
          {error && (
            <Alert status="error">
              <AlertIcon />
              {error}
            </Alert>
          )}
          <FormControl isRequired>
            <FormLabel htmlFor="leagueName">League Name</FormLabel>
            <Input
              id="leagueName"
              type="text"
              value={leagueName}
              onChange={(e) => setLeagueName(e.target.value)}
              placeholder="e.g., The Big Ten Gurus"
            />
          </FormControl>
          <Button
            type="submit"
            colorScheme="brand"
            w="full"
            isLoading={isSubmitting}
            spinner={<Spinner size="sm" />}
          >
            Create League
          </Button>
        </VStack>
      </form>
    </Box>
  );
}