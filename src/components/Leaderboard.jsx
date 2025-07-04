import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useSeason } from '../context/SeasonContext'; // <-- Import the new season hook
import SeasonSelector from './SeasonSelector'; // <-- Import the new component
import { Link as RouterLink } from 'react-router-dom';
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
  Center,
  VStack,
  Link,
} from '@chakra-ui/react';
import { StarIcon, InfoIcon } from '@chakra-ui/icons';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

// --- Sub-components (StatsChart, TotalsTable) remain the same ---

// --- Main Leaderboard Component ---
export default function Leaderboard() {
  const { user } = useAuth();
  const { selectedSeason } = useSeason(); // <-- Get the selected season
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
      // Filter weekly results by the selected season
      supabase.from('weekly_results').select('*').eq('season', selectedSeason)
    ]);

    if (profilesRes.error || weeklyResultsRes.error) {
      console.error('Error fetching data:', profilesRes.error || weeklyResultsRes.error);
      setLoading(false);
      return;
    }

    const profiles = profilesRes.data || [];
    const weeklyResults = weeklyResultsRes.data || [];
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

  // Refetch data whenever the selectedSeason changes
  useEffect(() => {
    fetchData();
  }, [selectedSeason]);

  // ... (handleSettleWeek, handlePaidUp, renderWeekStatus functions remain the same) ...

  if (loading) {
    return <Spinner />; // We can add a skeleton here later
  }

  return (
    <Box w="100%">
      <Flex justify="space-between" align="center" mb={2}>
        <Heading size="lg">Leaderboard</Heading>
        <Button colorScheme="teal" onClick={onOpen} isLoading={isSettling}>
          Settle Most Recent Week
        </Button>
      </Flex>
      
      <SeasonSelector /> {/* <-- Add the new component here */}

      {/* ... (Rest of the component remains the same) ... */}
    </Box>
  );
}
