import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLeague } from '../context/LeagueContext';
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

export default function JoinLeague() {
  const { session } = useAuth();
  const { refreshLeagues } = useLeague();
  const navigate = useNavigate();

  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleJoinLeague = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    if (!session) {
      setError('You must be logged in to join a league.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/join-league', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ inviteCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'An unknown error occurred.');
      }

      // Success!
      setSuccessMessage(data.message);
      await refreshLeagues();

      // Redirect user to the dashboard after a short delay
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formBg = useColorModeValue('white', 'gray.800');

  return (
    <Box maxW="md" mx="auto" mt={10} p={8} borderWidth={1} borderRadius={8} boxShadow="lg" bg={formBg}>
      <form onSubmit={handleJoinLeague}>
        <VStack spacing={4}>
          <Heading as="h2" size="lg">Join an Existing League</Heading>
          
          {error && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              {error}
            </Alert>
          )}

          {successMessage && (
            <Alert status="success" borderRadius="md">
              <AlertIcon />
              {successMessage} Redirecting...
            </Alert>
          )}

          <FormControl isRequired>
            <FormLabel htmlFor="inviteCode">Invite Code</FormLabel>
            <Input
              id="inviteCode"
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Enter the 6-character code"
              textTransform="uppercase"
            />
          </FormControl>
          <Button
            type="submit"
            colorScheme="brand"
            w="full"
            isLoading={isSubmitting}
            spinner={<Spinner size="sm" />}
            isDisabled={!!successMessage} // Disable button on success
          >
            Join League
          </Button>
        </VStack>
      </form>
    </Box>
  );
}