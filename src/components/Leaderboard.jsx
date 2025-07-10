import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useSeason } from '../context/SeasonContext';
import { Link as RouterLink } from 'react-router-dom';
import PageControls from './PageControls'; // <-- Import new component
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  Alert,
  AlertIcon,
  Center,
  Text,
  Avatar,
  HStack,
  Link,
} from '@chakra-ui/react';

export default function Leaderboard() {
  const { selectedSeason } = useSeason(); // <-- Get season from global context
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // This effect now re-runs automatically whenever the global selectedSeason changes
  useEffect(() => {
    if (!selectedSeason) return;

    const fetchLeaderboard = async () => {
      setLoading(true);
      setError(null);
      const { data, error: rpcError } = await supabase.rpc('get_leaderboard', {
        p_season: selectedSeason,
      });

      if (rpcError) {
        setError(rpcError.message);
      } else {
        setLeaderboardData(data);
      }
      setLoading(false);
    };

    fetchLeaderboard();
  }, [selectedSeason]);

  return (
    <Box maxW="800px" mx="auto">
      <Heading as="h1" mb={4}>Leaderboard</Heading>
      <PageControls /> {/* <-- Use the new component */}
      
      {loading ? (
        <Center p={10}><Spinner size="xl" /></Center>
      ) : error ? (
        <Alert status="error"><AlertIcon />{error}</Alert>
      ) : (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th isNumeric>Rank</Th>
              <Th>Player</Th>
              <Th isNumeric>Weeks Won</Th>
              <Th isNumeric>Weeks Lost</Th>
            </Tr>
          </Thead>
          <Tbody>
            {leaderboardData.map((player) => (
              <Tr key={player.user_id}>
                <Td isNumeric>{player.rank}</Td>
                <Td>
                  <Link as={RouterLink} to={`/profile/${player.user_id}`} _hover={{ textDecoration: 'underline' }}>
                    <HStack>
                      <Avatar size="sm" name={player.username} src={player.avatar_url} />
                      <Text>{player.username}</Text>
                    </HStack>
                  </Link>
                </Td>
                <Td isNumeric>{player.wins}</Td>
                <Td isNumeric>{player.losses}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </Box>
  );
}