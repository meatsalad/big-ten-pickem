import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useSeason } from '../context/SeasonContext';
import PageControls from './PageControls';
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
  Button,
  HStack,
  IconButton,
} from '@chakra-ui/react';
import { ArrowLeftIcon, ArrowRightIcon } from '@chakra-ui/icons';

export default function GameList() {
  // All hooks are at the top level
  const { user, session } = useAuth();
  const { selectedSeason, selectedWeek, availableWeeks } = useSeason();
  const [games, setGames] = useState([]);
  const [picks, setPicks] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // The problematic useColorModeValue hooks have been removed.

  useEffect(() => {
    if (!selectedWeek || !selectedSeason || !session) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const fetchDataForWeek = async () => {
      const headers = { Authorization: `Bearer ${session.access_token}` };
      try {
        const [gamesRes, picksRes, playersRes] = await Promise.all([
          fetch(`/.netlify/functions/get-games-by-week?season=${selectedSeason}&week=${selectedWeek}`, { headers }),
          fetch(`/.netlify/functions/get-picks-by-week?season=${selectedSeason}&week=${selectedWeek}`, { headers }),
          fetch(`/.netlify/functions/get-players-by-week?season=${selectedSeason}&week=${selectedWeek}`, { headers }),
        ]);

        if (!gamesRes.ok || !picksRes.ok || !playersRes.ok) {
          throw new Error('Failed to fetch weekly data.');
        }

        setGames(await gamesRes.json());
        setPicks(await picksRes.json());
        setPlayers(await playersRes.json());
        setError(null);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDataForWeek();
  }, [selectedWeek, selectedSeason, session]);

  // ... (handlePick and getPickForPlayerAndGame functions remain the same)
  const handlePick = async (game, selectedTeam) => {
    if (new Date(game.game_time) < new Date()) {
      alert("This game has already started. Picks are locked.");
      return;
    }
    try {
      const { data, error } = await supabase
        .from('picks')
        .upsert({
          user_id: user.id,
          game_id: game.id,
          week: game.week,
          season: game.season,
          selected_team: selectedTeam,
        }, { onConflict: 'user_id, game_id' })
        .select()
        .single();
      if (error) throw error;
      setPicks(currentPicks => [...currentPicks.filter(p => p.id !== data.id), data]);
    } catch (error) {
      alert("Error saving your pick: " + error.message);
    }
  };

  const getPickForPlayerAndGame = (playerId, gameId) => {
    return picks.find(p => p.user_id === playerId && p.game_id === gameId);
  };

  if (loading) {
    return (
        <Box>
            <Heading as="h1" mb={4}>Picks</Heading>
            <PageControls showWeekNav={true} />
            <Center p={10}><Spinner size="xl" /></Center>
        </Box>
    );
  }

  if (error) {
    return (
        <Box>
            <Heading as="h1" mb={4}>Picks</Heading>
            <PageControls showWeekNav={true} />
            <Alert status="error"><AlertIcon />{error}</Alert>
        </Box>
    );
  }
  
  return (
    <Box>
      <Heading as="h1" mb={4}>Picks</Heading>
      <PageControls showWeekNav={true} />

      {games.length === 0 ? (
        <Text>No games scheduled for this week.</Text>
      ) : (
        <Grid
          templateColumns={`repeat(${players.length + 1}, 1fr)`}
          gap={1}
          bg={['gray.200', 'gray.600']} // <-- UPDATED
          p={1}
          borderRadius="md"
        >
          <GridItem />
          {players.map(player => (
            <GridItem key={player.id} bg={['gray.100', 'gray.800']} p={2}> {/* <-- UPDATED */}
              <Center>
                <Text fontWeight="bold" textAlign="center" fontSize="sm">{player.username}</Text>
              </Center>
            </GridItem>
          ))}
          {games.map(game => {
            const myPick = getPickForPlayerAndGame(user.id, game.id);
            return(
              <React.Fragment key={game.id}>
                <GridItem bg={['gray.100', 'gray.800']} p={2}> {/* <-- UPDATED */}
                  <VStack spacing={1}>
                    <Button 
                      size="xs" 
                      w="full"
                      onClick={() => handlePick(game, game.away_team)}
                      colorScheme={myPick?.selected_team === game.away_team ? 'brand' : 'gray'}
                    >
                      {game.away_team}
                    </Button>
                    <Text fontWeight="bold" fontSize="xs">vs</Text>
                     <Button 
                      size="xs" 
                      w="full"
                      onClick={() => handlePick(game, game.home_team)}
                      colorScheme={myPick?.selected_team === game.home_team ? 'brand' : 'gray'}
                    >
                      {game.home_team}
                    </Button>
                  </VStack>
                </GridItem>
                {players.map(player => {
                  const pick = getPickForPlayerAndGame(player.id, game.id);
                  // Determine pick status color using the array syntax
                  let pickBgColor = ['gray.50', 'gray.700']; // Default
                  if (pick?.is_correct === true) pickBgColor = ['green.100', 'green.800'];
                  if (pick?.is_correct === false) pickBgColor = ['red.100', 'red.800'];
                  
                  return (
                    <GridItem key={`${game.id}-${player.id}`} bg={pickBgColor} p={4}> {/* <-- UPDATED */}
                      <Center>
                        <Text fontWeight="bold" fontSize="sm">
                          {pick ? pick.selected_team : '-'}
                        </Text>
                      </Center>
                    </GridItem>
                  );
                })}
              </React.Fragment>
            )
          })}
        </Grid>
      )}
    </Box>
  );
}