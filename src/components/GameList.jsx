import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Heading,
  Button,
  Flex,
  Spacer,
  VStack,
  HStack,
  Text,
  Tag,
  Spinner,
  IconButton,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Input,
  useToast,
  FormControl,
  FormLabel,
  List,
  ListItem,
  ListIcon,
  Alert,
  AlertIcon,
  ButtonGroup,
  Divider,
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons';

// --- Helper Functions & Components ---

const getCurrentNCAAFWeek = () => {
  const now = new Date();
  const seasonStart = new Date(now.getFullYear(), 7, 24);
  const week = Math.ceil((now - seasonStart) / (1000 * 60 * 60 * 24 * 7));
  return week > 0 ? week : 1;
};

const Countdown = ({ lockTime }) => {
    const calculateTimeLeft = () => {
        const difference = +new Date(lockTime) - +new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60)
            };
        }
        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearTimeout(timer);
    });

    const timerComponents = [];
    Object.keys(timeLeft).forEach(interval => {
        if (timeLeft[interval] > 0) {
            timerComponents.push(
                <Text key={interval}>
                    {timeLeft[interval]} {interval}{" "}
                </Text>
            );
        }
    });

    return (
        <Alert status="warning" mb={6} justifyContent="center" borderRadius="md">
            <AlertIcon />
            <Text fontWeight="bold" mr={2}>Picks Lock In:</Text>
            {timerComponents.length ? timerComponents : <Text>Time's up!</Text>}
        </Alert>
    );
};


// --- Main Component ---
export default function GameList() {
  const { user } = useAuth();
  const [selectedWeek, setSelectedWeek] = useState(1); // Start at Week 1 by default
  const [weekData, setWeekData] = useState({ games: [], players: [], picks: [] });
  const [firstKickoff, setFirstKickoff] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const [tiebreakerHomeScore, setTiebreakerHomeScore] = useState('');
  const [tiebreakerAwayScore, setTiebreakerAwayScore] = useState('');

  const fetchWeekData = async () => {
    setLoading(true);
    
    const { data: kickoffData, error: kickoffError } = await supabase
      .rpc('get_first_kickoff', { week_num: selectedWeek });

    if (kickoffError) console.error("Error fetching kickoff:", kickoffError);
    setFirstKickoff(kickoffData);

    const { data, error } = await supabase.rpc('get_picks_page_data', {
      p_week_number: selectedWeek,
    });

    if (error) {
      console.error('Error fetching week data:', error);
      setWeekData({ games: [], players: [], picks: [] });
    } else {
      const games = data.games || [];
      const picks = data.picks || [];
      setWeekData({ games, players: data.players || [], picks });
      
      const tiebreakerGame = games[games.length - 1];
      if(tiebreakerGame) {
          const userTiebreakerPick = picks.find(p => p.user_id === user.id && p.game_id === tiebreakerGame.id);
          if(userTiebreakerPick) {
              setTiebreakerHomeScore(userTiebreakerPick.predicted_home_score || '');
              setTiebreakerAwayScore(userTiebreakerPick.predicted_away_score || '');
          } else {
              setTiebreakerHomeScore('');
              setTiebreakerAwayScore('');
          }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWeekData();
  }, [selectedWeek, user.id]);

  const handlePick = async (gameId, selectedTeam) => {
    const { error } = await supabase
      .from('picks')
      .upsert(
        { user_id: user.id, game_id: gameId, selected_team: selectedTeam, week: selectedWeek },
        { onConflict: 'user_id, game_id' }
      );
    if (error) {
      toast({ title: 'Error making pick.', description: error.message, status: 'error' });
    } else {
      const updatedPicks = weekData.picks.filter(p => !(p.user_id === user.id && p.game_id === gameId));
      updatedPicks.push({ user_id: user.id, game_id: gameId, selected_team: selectedTeam });
      setWeekData(prev => ({...prev, picks: updatedPicks}));
    }
  };
  
  const handleTiebreakerSubmit = async () => {
    const tiebreakerGame = weekData.games?.[weekData.games.length - 1];
    if (!tiebreakerGame) return;

    const existingPick = weekData.picks.find(p => p.user_id === user.id && p.game_id === tiebreakerGame.id);
    if (!existingPick) {
        toast({ title: 'Please make a pick for the tiebreaker game first.', status: 'warning', duration: 3000, isClosable: true });
        return;
    }

    const { error } = await supabase
      .from('picks')
      .update({ 
          predicted_home_score: parseInt(tiebreakerHomeScore, 10) || null,
          predicted_away_score: parseInt(tiebreakerAwayScore, 10) || null
      })
      .match({ user_id: user.id, game_id: tiebreakerGame.id });

    if (error) {
        toast({ title: 'Error saving tiebreaker.', description: error.message, status: 'error' });
    } else {
        toast({ title: 'Tiebreaker saved!', status: 'success', duration: 2000 });
    }
  };

  const isLocked = firstKickoff ? new Date() > new Date(firstKickoff) : false;
  const isCurrentWeek = selectedWeek === getCurrentNCAAFWeek();

  return (
    <Box>
      <Flex align="center" mb={6}>
        <IconButton
          icon={<ChevronLeftIcon />}
          onClick={() => setSelectedWeek(prev => Math.max(1, prev - 1))}
          aria-label="Previous Week"
          isDisabled={selectedWeek === 1}
        />
        <Spacer />
        <Heading>Week {selectedWeek} Picks</Heading>
        <Spacer />
        <IconButton
          icon={<ChevronRightIcon />}
          onClick={() => setSelectedWeek(prev => prev + 1)}
          aria-label="Next Week"
          isDisabled={selectedWeek >= 14} // <-- Corrected Logic
        />
      </Flex>

      {isCurrentWeek && !isLocked && firstKickoff && <Countdown lockTime={firstKickoff} />}

      {loading ? (
        <Spinner />
      ) : (
        <Tabs isFitted variant="enclosed">
          <TabList>
            <Tab>By Game</Tab>
            <Tab>Grid View</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <PicksByGameView 
                weekData={weekData} 
                handlePick={handlePick} 
                isLocked={isLocked} 
                user={user}
                tiebreakerHomeScore={tiebreakerHomeScore}
                setTiebreakerHomeScore={setTiebreakerHomeScore}
                tiebreakerAwayScore={tiebreakerAwayScore}
                setTiebreakerAwayScore={setTiebreakerAwayScore}
                onTiebreakerSubmit={handleTiebreakerSubmit}
              />
            </TabPanel>
            <TabPanel>
              <PicksGridView weekData={weekData} isLocked={isLocked} />
            </TabPanel>
          </TabPanels>
        </Tabs>
      )}
    </Box>
  );
}

// --- Sub-Component for "By Game" View ---
const PicksByGameView = ({ 
    weekData, 
    handlePick, 
    isLocked, 
    user,
    tiebreakerHomeScore,
    setTiebreakerHomeScore,
    tiebreakerAwayScore,
    setTiebreakerAwayScore,
    onTiebreakerSubmit
}) => {
  const { games, picks, players } = weekData;

  const getUserPickForGame = (gameId) => {
    return picks.find(p => p.user_id === user.id && p.game_id === gameId)?.selected_team;
  };

  const getPicksForGame = (gameId) => {
    return players.map(player => {
        const pick = picks.find(p => p.user_id === player.id && p.game_id === gameId);
        return {
            username: player.username,
            selected_team: pick?.selected_team,
            is_correct: pick?.is_correct
        }
    }).filter(p => p.selected_team);
  };

  return (
    <VStack
      divider={<Divider />}
      spacing={0}
      align="stretch"
      maxW="container.lg" // Constrain the max width of the list
      mx="auto" // Center the list horizontally
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
    >
      {games.map((game, index) => {
        const userPick = getUserPickForGame(game.id);
        const allPicksForGame = getPicksForGame(game.id);
        const isTiebreakerGame = index === games.length - 1;

        return (
          <Box key={game.id} p={6}>
            <VStack align="stretch" spacing={4}>
              <Flex justify="space-between" align="center">
                <HStack>
                  <Heading size="md">{game.away_team} @ {game.home_team}</Heading>
                  {isTiebreakerGame && <Tag colorScheme="purple">🏆 Tiebreaker</Tag>}
                </HStack>
                {game.winning_team ? (
                  <Text fontWeight="bold">{game.away_team_score} - {game.home_team_score}</Text>
                ) : (
                  <Text fontSize="sm" color="gray.500">{new Date(game.game_time).toLocaleString()}</Text>
                )}
              </Flex>
              
              {isLocked ? (
                  <Box>
                      <Heading size="sm" mb={2}>All Picks</Heading>
                      <List spacing={1}>
                          {allPicksForGame.map(pick => (
                              <ListItem key={pick.username}>
                                  <ListIcon as={pick.is_correct ? CheckIcon : CloseIcon} color={pick.is_correct ? 'green.500' : 'red.500'} />
                                  {pick.username}: {pick.selected_team}
                              </ListItem>
                          ))}
                      </List>
                  </Box>
              ) : (
                  <Flex justify="center">
                      <ButtonGroup isAttached variant="outline">
                          <Button
                              variant={userPick === game.away_team ? 'solid' : 'outline'}
                              colorScheme={userPick === game.away_team ? 'brand' : 'gray'}
                              leftIcon={userPick === game.away_team ? <CheckIcon /> : undefined}
                              onClick={() => handlePick(game.id, game.away_team)}
                          >
                              {game.away_team}
                          </Button>
                          <Button
                              variant={userPick === game.home_team ? 'solid' : 'outline'}
                              colorScheme={userPick === game.home_team ? 'brand' : 'gray'}
                              leftIcon={userPick === game.home_team ? <CheckIcon /> : undefined}
                              onClick={() => handlePick(game.id, game.home_team)}
                          >
                              {game.home_team}
                          </Button>
                      </ButtonGroup>
                  </Flex>
              )}
              
              {isTiebreakerGame && !isLocked && (
                  <VStack align="stretch" pt={4} borderTopWidth="1px" borderColor="gray.200">
                      <Text fontSize="sm" color="gray.600" fontWeight="bold">Predict the score for this game:</Text>
                      <HStack>
                          <FormControl>
                              <FormLabel>{game.away_team} Score</FormLabel>
                              <Input type="number" value={tiebreakerAwayScore} onChange={(e) => setTiebreakerAwayScore(e.target.value)} />
                          </FormControl>
                          <FormControl>
                              <FormLabel>{game.home_team} Score</FormLabel>
                              <Input type="number" value={tiebreakerHomeScore} onChange={(e) => setTiebreakerHomeScore(e.target.value)} />
                          </FormControl>
                      </HStack>
                      <Button colorScheme="blue" onClick={onTiebreakerSubmit} size="sm">Save Tiebreaker</Button>
                  </VStack>
              )}
            </VStack>
          </Box>
        );
      })}
    </VStack>
  );
};

// --- Sub-Component for "Grid" View ---
const PicksGridView = ({ weekData, isLocked }) => {
    if (!isLocked) {
        return (
            <Alert status="info">
                <AlertIcon />
                The grid view will be available after the first game of the week kicks off.
            </Alert>
        )
    }
    const { games, players, picks } = weekData;

    const getPickForPlayerAndGame = (playerId, gameId) => {
        return picks.find(p => p.user_id === playerId && p.game_id === gameId);
    };

    return (
        <TableContainer>
            <Table variant="simple" size="sm">
                <Thead>
                    <Tr>
                        <Th>Player</Th>
                        {games.map(game => (
                            <Th key={game.id}>{game.away_team} @ {game.home_team}</Th>
                        ))}
                    </Tr>
                </Thead>
                <Tbody>
                    {players.map(player => (
                        <Tr key={player.id}>
                            <Td>{player.username}</Td>
                            {games.map(game => {
                                const pick = getPickForPlayerAndGame(player.id, game.id);
                                const isCorrect = pick?.is_correct;
                                const bgColor = isCorrect === true ? 'green.100' : isCorrect === false ? 'red.100' : 'transparent';
                                
                                return (
                                    <Td key={game.id} bg={bgColor}>
                                        {pick?.selected_team || '-'}
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
