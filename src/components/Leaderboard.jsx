import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Heading,
  Text,
  Badge,
  Button,
  useToast,
  Spinner,
  HStack,
  Flex,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  SimpleGrid,
  Avatar,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
} from '@chakra-ui/react';
import { StarIcon } from '@chakra-ui/icons';
// Import Recharts components
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

// --- Sub-component for the stats chart ---
const StatsChart = ({ data }) => {
  const chartData = data.map(player => ({
    name: player.username,
    Wins: player.totalWins,
    Poopstars: player.totalPoopstars,
    Perfects: player.totalPerfectPicks,
  }));

  return (
    <Box mt={10}>
      <Heading size="lg" mb={4}>Season Stats</Heading>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="Wins" fill="#48BB78" />
          <Bar dataKey="Poopstars" fill="#F56565" />
          <Bar dataKey="Perfects" fill="#9F7AEA" />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

// --- Sub-component for the totals table ---
const TotalsTable = ({ data }) => {
  return (
    <Box mt={10}>
        <Heading size="lg" mb={4}>Financials</Heading>
        <TableContainer>
            <Table variant="simple" size="sm">
                <Thead>
                    <Tr>
                        <Th>Player</Th>
                        <Th isNumeric>$$$ Won</Th>
                        <Th isNumeric>$$$ Paid</Th>
                        <Th isNumeric>Season Net</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {data.map(player => (
                        <Tr key={player.id}>
                            <Td>{player.username}</Td>
                            <Td isNumeric color="green.500">${player.totalWinnings}</Td>
                            <Td isNumeric color="red.500">${player.totalPaid}</Td>
                            <Td isNumeric fontWeight="bold">${player.totalWinnings - player.totalPaid}</Td>
                        </Tr>
                    ))}
                </Tbody>
            </Table>
        </TableContainer>
    </Box>
  )
}

// --- Main Leaderboard Component ---
export default function Leaderboard() {
  const { user } = useAuth();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef();

  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSettling, setIsSettling] = useState(false);
  const totalWeeks = 14;

  const fetchData = async () => {
    setLoading(true);
    const [profilesRes, weeklyResultsRes] = await Promise.all([
      supabase.from('profiles').select('id, username, avatar_url'),
      supabase.from('weekly_results').select('*')
    ]);

    if (profilesRes.error || weeklyResultsRes.error) {
      console.error('Error fetching data:', profilesRes.error || weeklyResultsRes.error);
      setLoading(false);
      return;
    }

    const profiles = profilesRes.data;
    const weeklyResults = weeklyResultsRes.data;
    const playerCount = profiles.length;

    const processedData = profiles.map((profile) => {
      const userWeeklyResults = weeklyResults.filter(r => r.user_id === profile.id);

      const totalWins = userWeeklyResults.filter(r => r.is_winner).length;
      const totalPoopstars = userWeeklyResults.filter(r => r.is_poopstar).length;
      const totalPerfectPicks = userWeeklyResults.filter(r => r.is_perfect).length;
      
      let totalWinnings = 0;
      let totalPaid = 0;

      for (let week = 1; week <= totalWeeks; week++) {
          const weekResult = userWeeklyResults.find(r => r.week === week);
          if (!weekResult) continue;

          const potSize = weeklyResults.some(r => r.week === week && r.is_perfect) ? 20 : 10;
          const losersCount = playerCount - weeklyResults.filter(r => r.week === week && r.is_winner).length;
          
          if (weekResult.is_winner) {
              totalWinnings += potSize * losersCount;
          } else {
              totalPaid += potSize;
          }
      }

      const weekly = userWeeklyResults.reduce((acc, result) => {
        acc[result.week] = result;
        return acc;
      }, {});

      return { ...profile, totalWins, totalPoopstars, totalPerfectPicks, weekly, totalWinnings, totalPaid };
    });

    processedData.sort((a, b) => b.totalWins - a.totalWins);
    setLeaderboardData(processedData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSettleWeek = async () => {
    setIsSettling(true);
    try {
      const response = await fetch('/.netlify/functions/settle-most-recent-week', {
        method: 'POST',
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to settle week.');
      }

      toast({ title: 'Success!', description: result, status: 'success', duration: 5000, isClosable: true });
      fetchData(); // Refresh the leaderboard data
    } catch (error) {
      toast({ title: 'Error Settling Week', description: error.message, status: 'error', duration: 5000, isClosable: true });
    } finally {
      setIsSettling(false);
      onClose();
    }
  };

  const handlePaidUp = async (week, playerId) => {
    const { error } = await supabase
      .from('weekly_results')
      .update({ has_paid: true })
      .match({ user_id: playerId, week: week });

    if (error) {
      toast({ title: 'Error', description: error.message, status: 'error' });
    } else {
      toast({ title: 'Payment marked as received!', status: 'success', duration: 2000 });
      fetchData();
    }
  };

  const renderWeekStatus = (player, weekNumber) => {
    const weekData = player.weekly[weekNumber];
    if (!weekData) return <Text color="gray.400">-</Text>;

    if (weekData.is_perfect) {
      return (
        <Badge colorScheme="purple" variant="solid">
          <HStack spacing={1}>
            <StarIcon />
            <Text>Perfect</Text>
          </HStack>
        </Badge>
      );
    }
    if (weekData.is_winner) return <Badge colorScheme="green">Winner</Badge>;
    if (weekData.has_paid) return <Badge colorScheme="blue">Paid Up</Badge>;
    
    if (player.id === user.id) {
        return <Button size="xs" colorScheme="red" onClick={() => handlePaidUp(weekNumber, player.id)}>Pay Up</Button>;
    }
    
    return <Badge colorScheme="red">Needs to Pay</Badge>;
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <Box w="100%">
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="lg">Leaderboard</Heading>
        <Button colorScheme="teal" onClick={onOpen} isLoading={isSettling}>
          Settle Most Recent Week
        </Button>
      </Flex>
      
      <Accordion allowMultiple>
        {leaderboardData.map((player, index) => (
          <AccordionItem key={player.id}>
            <h2>
              <AccordionButton>
                <HStack flex="1" textAlign="left" spacing={4}>
                  <Text fontWeight="bold" fontSize="xl" w="40px">#{index + 1}</Text>
                  <Avatar size="sm" name={player.username} src={player.avatar_url} />
                  <Text fontWeight="bold">{player.username}</Text>
                  <Text fontSize="sm" color="gray.600">(Wins: {player.totalWins}, Poopstars: {player.totalPoopstars})</Text>
                </HStack>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              <SimpleGrid columns={{ base: 2, sm: 4, md: 7 }} spacing={4}>
                {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((week) => (
                  <Box key={week} textAlign="center">
                    <Text fontWeight="bold" fontSize="sm">Wk {week}</Text>
                    {renderWeekStatus(player, week)}
                  </Box>
                ))}
              </SimpleGrid>
            </AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>

      <StatsChart data={leaderboardData} />
      <TotalsTable data={leaderboardData} />

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Confirm Settlement
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to settle the most recent un-settled week? This will finalize the winner and poopstar.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleSettleWeek} ml={3}>
                Confirm
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
