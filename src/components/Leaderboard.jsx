import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Text,
  Badge,
} from '@chakra-ui/react';

export default function Leaderboard() {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const totalWeeks = 14; // Total weeks in the season

  useEffect(() => {
    const fetchData = async () => {
      // 1. Fetch all user profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, username');

      if (profileError) {
        console.error('Error fetching profiles:', profileError);
        return;
      }

      // 2. Fetch all weekly results
      const { data: weeklyResults, error: resultsError } = await supabase
        .from('weekly_results')
        .select('*');

      if (resultsError) {
        console.error('Error fetching weekly results:', resultsError);
        return;
      }

      // 3. Process and combine the data
      const processedData = profiles.map((profile) => {
        // Filter results for the current user
        const userResults = weeklyResults.filter(
          (result) => result.user_id === profile.id
        );

        // Calculate totals
        const totalWins = userResults.filter((r) => r.is_winner).length;
        const totalPoopstars = userResults.filter((r) => r.is_poopstar).length;
        const totalPerfectPicks = userResults.filter((r) => r.is_perfect).length;
        
        // Create a map of the user's weekly status for easy lookup
        const weekly = userResults.reduce((acc, result) => {
          acc[result.week] = result;
          return acc;
        }, {});

        return {
          ...profile,
          totalWins,
          totalPoopstars,
          totalPerfectPicks,
          weekly,
        };
      });

      setLeaderboardData(processedData);
    };

    fetchData();
  }, []);

  // Helper function to render the status for each week
  const renderWeekStatus = (player, weekNumber) => {
    const weekData = player.weekly[weekNumber];
    if (!weekData) return <Text color="gray.400">-</Text>;
    if (weekData.is_winner) return <Badge colorScheme="green">Winner</Badge>;
    if (weekData.is_perfect) return <Badge colorScheme="purple">Perfect</Badge>;
    if (weekData.has_paid) return <Badge colorScheme="blue">Paid Up</Badge>;
    // For now, we show "Needs to Pay". Later, this will be a button.
    return <Badge colorScheme="red">Needs to Pay</Badge>;
  };

  return (
    <Box w="100%">
      <Heading size="lg" mb={4}>Leaderboard</Heading>
      <TableContainer>
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Player</Th>
              <Th isNumeric>Wins</Th>
              <Th isNumeric>Poopstars</Th>
              <Th isNumeric>Perfects</Th>
              {/* Create a header for each week */}
              {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((week) => (
                <Th key={week} isNumeric>Wk {week}</Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {leaderboardData.map((player) => (
              <Tr key={player.id}>
                <Td fontWeight="bold">{player.username}</Td>
                <Td isNumeric>{player.totalWins}</Td>
                <Td isNumeric>{player.totalPoopstars}</Td>
                <Td isNumeric>{player.totalPerfectPicks}</Td>
                {/* Create a cell for each week's status */}
                {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((week) => (
                  <Td key={`${player.id}-wk-${week}`} isNumeric>
                    {renderWeekStatus(player, week)}
                  </Td>
                ))}
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
}