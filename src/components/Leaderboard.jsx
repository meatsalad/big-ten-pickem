import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
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
  Button,
  useToast,
  Spinner,
  HStack,
  Flex,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
} from '@chakra-ui/react';
import { StarIcon } from '@chakra-ui/icons';

// Helper to get the PREVIOUS college football week
const getPreviousNCAAFWeek = () => {
  const now = new Date();
  const seasonStart = new Date(now.getFullYear(), 7, 24); 
  const week = Math.ceil((now - seasonStart) / (1000 * 60 * 60 * 24 * 7));
  return week > 1 ? week - 1 : 1;
};

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
    const { data: profiles } = await supabase.from('profiles').select('id, username');
    const { data: weeklyResults } = await supabase.from('weekly_results').select('*');

    if (profiles && weeklyResults) {
        const processedData = profiles.map((profile) => {
          const userResults = weeklyResults.filter(r => r.user_id === profile.id);
          const totalWins = userResults.filter(r => r.is_winner).length;
          const totalPoopstars = userResults.filter(r => r.is_poopstar).length;
          const totalPerfectPicks = userResults.filter(r => r.is_perfect).length;
          const weekly = userResults.reduce((acc, result) => {
            acc[result.week] = result;
            return acc;
          }, {});
          return { ...profile, totalWins, totalPoopstars, totalPerfectPicks, weekly };
        });
        setLeaderboardData(processedData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSettleWeek = async () => {
    setIsSettling(true);
    const weekToSettle = getPreviousNCAAFWeek();
    
    try {
      const response = await fetch('/.netlify/functions/settle-weekly-results', {
        method: 'POST',
        body: JSON.stringify({ week: weekToSettle }),
      });

      if (!response.ok) {
        throw new Error('Failed to settle week.');
      }

      toast({ title: `Week ${weekToSettle} settled!`, status: 'success' });
      fetchData(); // Refresh the leaderboard
    } catch (error) {
      toast({ title: 'Error settling week', description: error.message, status: 'error' });
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

  if (loading) return <Spinner />;

  return (
    <Box w="100%">
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="lg">Leaderboard</Heading>
        <Button colorScheme="teal" onClick={onOpen} isLoading={isSettling}>
          Settle Week {getPreviousNCAAFWeek()}
        </Button>
      </Flex>
      
      <TableContainer>
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Player</Th>
              <Th isNumeric>Wins</Th>
              <Th isNumeric>Poopstars</Th>
              <Th isNumeric>Perfects</Th>
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

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Settle Week {getPreviousNCAAFWeek()}
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure all games for the week are complete? This action is irreversible and will finalize the results.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleSettleWeek} ml={3}>
                Confirm Settlement
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
