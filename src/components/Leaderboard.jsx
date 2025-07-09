import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useSeason } from '../context/SeasonContext';
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
} from '@chakra-ui/react';

const Leaderboard = () => {
  const { selectedSeason } = useSeason();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!selectedSeason) return;

    const fetchLeaderboard = async () => {
      setLoading(true);
      setError(null);
      setLeaderboardData([]);

      try {
        const { data, error: rpcError } = await supabase.rpc('get_leaderboard', {
          p_season: selectedSeason,
        });

        if (rpcError) {
          throw rpcError;
        }
        
        setLeaderboardData(data);
      } catch (err) {
        console.error('Error fetching leaderboard data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [selectedSeason]); // Re-fetch when season changes

  const renderContent = () => {
    if (loading) {
      return (
        <Center p={10}>
          <Spinner size="xl" />
        </Center>
      );
    }

    if (error) {
      return (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          There was an error fetching the leaderboard: {error}
        </Alert>
      );
    }
    
    if (leaderboardData.length === 0) {
      return <Text>No leaderboard data available for the {selectedSeason} season yet.</Text>
    }

    return (
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
            <Tr key={player.username}>
              <Td isNumeric>{player.rank}</Td>
              <Td>{player.username}</Td>
              <Td isNumeric>{player.wins}</Td>
              <Td isNumeric>{player.losses}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    );
  };

  return (
    <Box>
      <Heading as="h1" mb={6}>
        Leaderboard: {selectedSeason} Season
      </Heading>
      {renderContent()}
    </Box>
  );
};

export default Leaderboard;