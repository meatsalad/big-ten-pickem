import { useState, useEffect } from 'react';
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
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Tag,
  List,
  ListItem,
  ListIcon,
  Spinner,
  IconButton,
} from '@chakra-ui/react';
import { CheckIcon, CloseIcon, ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';

// Helper to determine the current week of the NCAAF season
const getCurrentNCAAFWeek = () => {
    const now = new Date();
    const seasonStart = new Date(now.getFullYear(), 7, 24);
    const week = Math.ceil((now - seasonStart) / (1000 * 60 * 60 * 24 * 7));
    return week > 0 ? week : 1;
};

const CURRENT_WEEK = getCurrentNCAAFWeek();

export default function GameList() {
  const { user } = useAuth();
  const [selectedWeek, setSelectedWeek] = useState(CURRENT_WEEK);
  const [weekData, setWeekData] = useState({ games: [], user_picks: [], all_picks: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeekData = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_picks_page_data', {
        p_week_number: selectedWeek,
        p_user_id: user.id,
      });

      if (error) {
        console.error('Error fetching week data:', error);
        setWeekData({ games: [], user_picks: [], all_picks: [] });
      } else {
        // Handle cases where parts of the data might be null from the DB
        setWeekData({
          games: data.games || [],
          user_picks: data.user_picks || [],
          all_picks: data.all_picks || [],
        });
      }
      setLoading(false);
    };

    fetchWeekData();
  }, [selectedWeek, user.id]);

  const handlePick = async (gameId, selectedTeam) => {
    // Optimistically update the UI
    const newUserPicks = [...weekData.user_picks.filter(p => p.game_id !== gameId), { game_id: gameId, selected_team: selectedTeam }];
    setWeekData(prev => ({ ...prev, user_picks: newUserPicks }));

    await supabase
      .from('picks')
      .upsert(
        { user_id: user.id, game_id: gameId, selected_team: selectedTeam, week: selectedWeek },
        { onConflict: 'user_id, game_id' }
      );
  };

  const getUserPickForGame = (gameId) => {
    return weekData.user_picks.find(p => p.game_id === gameId)?.selected_team;
  };
  
  const getPicksForGame = (gameId) => {
      return weekData.all_picks.filter(p => p.game_id === gameId);
  }

  const isCurrentWeek = selectedWeek === CURRENT_WEEK;

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
        <Heading>Week {selectedWeek}</Heading>
        <Spacer />
        <IconButton
          icon={<ChevronRightIcon />}
          onClick={() => setSelectedWeek(prev => prev + 1)}
          aria-label="Next Week"
          isDisabled={isCurrentWeek}
        />
      </Flex>

      {loading ? (
        <Spinner />
      ) : (
        <VStack spacing={8}>
          {weekData.games.map((game) => {
            const userPick = getUserPickForGame(game.id);
            const allPicksForGame = getPicksForGame(game.id);

            return (
              <Card key={game.id} w="100%" variant="outline">
                <CardHeader>
                  <HStack>
                    <Text color="gray.500">{new Date(game.game_time).toLocaleString()}</Text>
                    {game.winning_team && <Tag colorScheme="green">Final</Tag>}
                  </HStack>
                </CardHeader>
                <CardBody>
                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                    {/* Game Info & Picking */}
                    <VStack>
                      <Heading size="md">{game.away_team} @ {game.home_team}</Heading>
                      {game.winning_team && (
                        <Text fontWeight="bold">
                          Result: {game.away_team_score} - {game.home_team_score}
                        </Text>
                      )}
                      {isCurrentWeek && (
                        <HStack mt={4}>
                          <Button
                            colorScheme={userPick === game.away_team ? 'blue' : 'gray'}
                            onClick={() => handlePick(game.id, game.away_team)}
                          >
                            {game.away_team}
                          </Button>
                          <Button
                            colorScheme={userPick === game.home_team ? 'blue' : 'gray'}
                            onClick={() => handlePick(game.id, game.home_team)}
                          >
                            {game.home_team}
                          </Button>
                        </HStack>
                      )}
                    </VStack>
                    
                    {/* Your Pick */}
                    <VStack>
                       <Heading size="sm" color="gray.600">Your Pick</Heading>
                       <Text fontWeight="bold" fontSize="lg">{userPick || 'None'}</Text>
                       {!isCurrentWeek && userPick && (
                           game.winning_team === userPick 
                           ? <Tag colorScheme="green">Correct</Tag> 
                           : <Tag colorScheme="red">Incorrect</Tag>
                       )}
                    </VStack>

                    {/* All Picks (Historical View) */}
                    {!isCurrentWeek && (
                      <VStack>
                        <Heading size="sm" color="gray.600">All Picks</Heading>
                        <List spacing={1}>
                            {allPicksForGame.map(pick => (
                                <ListItem key={pick.username}>
                                    <ListIcon as={pick.is_correct ? CheckIcon : CloseIcon} color={pick.is_correct ? 'green.500' : 'red.500'} />
                                    {pick.username}: {pick.selected_team}
                                </ListItem>
                            ))}
                        </List>
                      </VStack>
                    )}
                  </SimpleGrid>
                </CardBody>
              </Card>
            );
          })}
        </VStack>
      )}
    </Box>
  );
}
