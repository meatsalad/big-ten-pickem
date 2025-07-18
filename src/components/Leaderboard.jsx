import React, { useState, useEffect } from 'react';
import { useSeason } from '../context/SeasonContext';
import { useLeague } from '../context/LeagueContext'; // 1. Import the new league hook
import { Link as RouterLink } from 'react-router-dom';
import PageControls from './PageControls';
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
  const { selectedSeason } = useSeason();
  const { selectedLeague } = useLeague(); // 2. Get the selected league from context
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 3. This effect now re-runs when either the season or the league changes
  useEffect(() => {
    // Don't fetch if we don't have the required data yet
    if (!selectedSeason || !selectedLeague) {
      setLoading(false);
      return;
    }

    const fetchLeaderboard = async () => {
      setLoading(true);
      setError(null);
      setLeaderboardData([]);

      try {
        // 4. Call the new serverless function with both parameters
        const response = await fetch(`/.netlify/functions/get-leaderboard?season=${selectedSeason}&league_id=${selectedLeague.id}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch leaderboard');
        }
        const data = await response.json();
        setLeaderboardData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [selectedSeason, selectedLeague]);

  const renderContent = () => {
    if (loading) {
      return <Center p={10}><Spinner size="xl" /></Center>;
    }
    if (error) {
      return <Alert status="error"><AlertIcon />{error}</Alert>;
    }
    if (leaderboardData.length === 0) {
      return <Text>No results found for this season yet.</Text>;
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
    );
  };

  return (
    <Box maxW="800px" mx="auto">
      <Heading as="h1" mb={4}>Leaderboard</Heading>
      <PageControls /> {/* 5. Use the controls component */}
      {renderContent()}
    </Box>
  );
}