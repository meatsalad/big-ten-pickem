import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useSeason } from '../context/SeasonContext';
import { useLeague } from '../context/LeagueContext';
import PageControls from './PageControls';
import GameCard from './GameCard';
import CountdownTimer from './CountdownTimer'; // 1. Import the new component
import {
  Box,
  Heading,
  Spinner,
  Alert,
  AlertIcon,
  Text,
  Center,
  VStack,
  Button,
  SimpleGrid,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Avatar,
  HStack,
} from '@chakra-ui/react';


const PicksMatrixView = ({ games, players, picks }) => {
    const { user } = useAuth();
    
    return (
        <TableContainer borderWidth="1px" borderRadius="lg">
            <Table variant="simple">
                <Thead bg="gray.100" position="sticky" top="0" zIndex="docked">
                    <Tr>
                        <Th>Matchup</Th>
                        {players.map(player => (
                            <Th key={player.id} isNumeric={player.id !== user.id} bg={player.id === user.id ? 'brand.50' : 'transparent'}>
                                <HStack justify={player.id === user.id ? "flex-end" : "flex-start"}>
                                    <Avatar size="xs" name={player.username} src={player.avatar_url} />
                                    <Text>{player.username}</Text>
                                </HStack>
                            </Th>
                        ))}
                    </Tr>
                </Thead>
                <Tbody>
                    {games.map(game => (
                        <Tr key={game.id}>
                            <Td>
                                <VStack align="flex-start" spacing={0}>
                                    <Text fontSize="sm">{game.away_team}</Text>
                                    <Text fontSize="xs" color="gray.500">@</Text>
                                    <Text fontSize="sm" fontWeight="bold">{game.home_team}</Text>
                                </VStack>
                            </Td>
                            {players.map(player => {
                                const pick = picks.find(p => p.user_id === player.id && p.game_id === game.id);
                                let pickBgColor = 'transparent';
                                if (pick?.is_correct === true) pickBgColor = 'green.100';
                                if (pick?.is_correct === false) pickBgColor = 'red.100';

                                return (
                                    <Td 
                                        key={`${game.id}-${player.id}`} 
                                        isNumeric={player.id !== user.id}
                                        bg={pickBgColor}
                                        fontWeight={pick?.selected_team ? 'bold' : 'normal'}
                                    >
                                      {pick ? pick.selected_team : '-'}
                                    </Td>
                                );
                            })}
                        </Tr>
                    ))}
                </Tbody>
            </Table>
        </TableContainer>
    );
};


export default function GameList() {
  const { user, session } = useAuth();
  const { selectedSeason, selectedWeek } = useSeason();
  const { selectedLeague } = useLeague();

  const [games, setGames] = useState([]);
  const [picks, setPicks] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('cards');

  useEffect(() => {
    if (!selectedWeek || !selectedSeason || !selectedLeague || !session) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const fetchDataForWeek = async () => {
      const headers = { Authorization: `Bearer ${session.access_token}` };
      try {
        const [gamesRes, picksRes, playersRes] = await Promise.all([
          fetch(`/.netlify/functions/get-games-by-week?season=${selectedSeason}&week=${selectedWeek}&league_id=${selectedLeague.id}`, { headers }),
          fetch(`/.netlify/functions/get-picks-by-week?season=${selectedSeason}&week=${selectedWeek}&league_id=${selectedLeague.id}`, { headers }),
          fetch(`/.netlify/functions/get-players-by-week?season=${selectedSeason}&week=${selectedWeek}&league_id=${selectedLeague.id}`, { headers }),
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
  }, [selectedWeek, selectedSeason, selectedLeague, session]);

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
          league_id: selectedLeague.id,
          selected_team: selectedTeam,
        }, { onConflict: 'user_id, game_id, league_id' })
        .select()
        .single();
      if (error) throw error;
      setPicks(currentPicks => [...currentPicks.filter(p => p.game_id !== game.id || p.user_id !== user.id), data]);
    } catch (error) {
      alert("Error saving your pick: " + error.message);
    }
  };
  
  const renderContent = () => {
    if (loading) return <Center p={10}><Spinner size="xl" /></Center>;
    if (error) return <Alert status="error"><AlertIcon />{error}</Alert>;
    if (games.length === 0) return <Text>No games scheduled for this week.</Text>;
    
    if (viewMode === 'matrix') {
        return <PicksMatrixView games={games} players={players} picks={picks} />;
    }

    return (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            {games.map(game => {
                const myPick = picks.find(p => p.user_id === user.id && p.game_id === game.id);
                return <GameCard key={game.id} game={game} myPick={myPick} onPick={handlePick} />;
            })}
        </SimpleGrid>
    );
  };
  
  return (
    <Box>
      <Heading as="h1" mb={4}>Picks</Heading>
      <PageControls showWeekNav={true} />
      
      {/* 2. Render the CountdownTimer component here */}
      {!loading && games.length > 0 && <CountdownTimer games={games} />}
      
      <Button onClick={() => setViewMode(viewMode === 'cards' ? 'matrix' : 'cards')} mb={4}>
        {viewMode === 'cards' ? 'View All Picks (Matrix)' : 'View My Picks (Cards)'}
      </Button>

      {renderContent()}
    </Box>
  );
}