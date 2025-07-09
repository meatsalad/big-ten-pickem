import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useSeason } from '../context/SeasonContext';
import {
  Box,
  Heading,
  Spinner,
  Alert,
  AlertIcon,
  Grid,
  GridItem,
  Text,
  Center,
  VStack,
  Image,
  useColorModeValue,
} from '@chakra-ui/react';

const GameList = () => {
  const { session } = useAuth();
  const { selectedSeason } = useSeason();

  const [games, setGames] = useState([]);
  const [picks, setPicks] = useState([]);
  const [players, setPlayers] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const headerBgColor = useColorModeValue('gray.100', 'gray.800');

  useEffect(() => {
    if (!selectedSeason) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. Determine the most recent week for the selected season
        const { data: weekData, error: weekError } = await supabase
          .from('games')
          .select('week')
          .eq('season', selectedSeason)
          .order('week', { ascending: false })
          .limit(1);

        if (weekError) throw weekError;
        const latestWeek = weekData?.[0]?.week;
        if (!latestWeek) {
            setLoading(false);
            return; // No games for this season yet
        }
        setCurrentWeek(latestWeek);

        // 2. Fetch all data for that week using our new serverless functions
        const headers = { Authorization: `Bearer ${session.access_token}` };
        const [gamesRes, picksRes, playersRes] = await Promise.all([
          fetch(`/.netlify/functions/get-games-by-week?season=${selectedSeason}&week=${latestWeek}`, { headers }),
          fetch(`/.netlify/functions/get-picks-by-week?season=${selectedSeason}&week=${latestWeek}`, { headers }),
          fetch(`/.netlify/functions/get-players-by-week?season=${selectedSeason}&week=${latestWeek}`, { headers }),
        ]);

        if (!gamesRes.ok || !picksRes.ok || !playersRes.ok) {
          throw new Error('Failed to fetch weekly data.');
        }

        setGames(await gamesRes.json());
        setPicks(await picksRes.json());
        setPlayers(await playersRes.json());
        
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedSeason, session]);

  const getPickForPlayerAndGame = (playerId, gameId) => {
    return picks.find(p => p.user_id === playerId && p.game_id === gameId);
  };

  if (loading) {
    return <Center p={10}><Spinner size="xl" /></Center>;
  }

  if (error) {
    return <Alert status="error"><AlertIcon />Error fetching game data: {error}</Alert>;
  }
  
  if (games.length === 0) {
      return <Text>No games scheduled for the selected season yet.</Text>
  }

  return (
    <Box>
      <Heading as="h1" mb={6}>
        Week {currentWeek} Picks ({selectedSeason} Season)
      </Heading>
      <Grid
        templateColumns={`repeat(${players.length + 1}, 1fr)`}
        gap={1}
        bg={useColorModeValue('gray.200', 'gray.600')}
        p={1}
        borderRadius="md"
      >
        {/* Top-left empty cell */}
        <GridItem />

        {/* Player Headers */}
        {players.map(player => (
          <GridItem key={player.id} bg={headerBgColor} p={4}>
            <Text fontWeight="bold" textAlign="center">{player.username}</Text>
          </GridItem>
        ))}

        {/* Game Rows */}
        {games.map(game => (
          <React.Fragment key={game.id}>
            <GridItem bg={headerBgColor} p={2}>
              <VStack>
                <Text fontSize="sm">{game.away_team}</Text>
                <Text fontWeight="bold">vs</Text>
                <Text fontSize="sm">{game.home_team}</Text>
              </VStack>
            </GridItem>
            
            {players.map(player => {
              const pick = getPickForPlayerAndGame(player.id, game.id);
              return (
                <GridItem key={`${game.id}-${player.id}`} bg={bgColor} p={4}>
                  <Center>
                    <Text fontWeight="bold">
                      {pick ? pick.selected_team : '-'}
                    </Text>
                  </Center>
                </GridItem>
              );
            })}
          </React.Fragment>
        ))}
      </Grid>
    </Box>
  );
};

export default GameList;