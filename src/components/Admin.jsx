import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import {
  Box,
  Heading,
  Text,
  VStack,
  FormControl,
  FormLabel,
  Select,
  Button,
  useToast,
  Spinner,
  Divider,
  HStack,
  Input,
  NumberInput,
  NumberInputField,
} from '@chakra-ui/react';

const EditPickForm = () => {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [weeks, setWeeks] = useState([]);
  const [games, setGames] = useState([]);

  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('');
  const [selectedGameId, setSelectedGameId] = useState('');
  const [selectedPick, setSelectedPick] = useState(null);
  const [newPick, setNewPick] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch initial data for users and weeks
  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: usersData } = await supabase.from('profiles').select('id, username');
      setUsers(usersData || []);
      const { data: weeksData } = await supabase.from('games').select('week');
      if (weeksData) {
        const uniqueWeeks = [...new Set(weeksData.map(g => g.week))];
        setWeeks(uniqueWeeks.sort((a,b) => a-b));
      }
    };
    fetchInitialData();
  }, []);

  // Fetch games when a week is selected
  useEffect(() => {
    if (!selectedWeek) return;
    const fetchGames = async () => {
      const { data } = await supabase.from('games').select('*').eq('week', selectedWeek);
      setGames(data || []);
    };
    fetchGames();
  }, [selectedWeek]);

  // Fetch a user's pick for a specific game
  useEffect(() => {
    if (!selectedUserId || !selectedGameId) {
        setSelectedPick(null);
        return;
    };
    const fetchPick = async () => {
        const { data } = await supabase
            .from('picks')
            .select('*, games(home_team, away_team)')
            .eq('user_id', selectedUserId)
            .eq('game_id', selectedGameId)
            .single();
        setSelectedPick(data);
        setNewPick(data?.selected_team || '');
    };
    fetchPick();
  }, [selectedUserId, selectedGameId]);

  const handleSubmit = async () => {
    if (!selectedPick || !newPick) {
        toast({ title: 'Please select a pick and a new team.', status: 'warning' });
        return;
    }
    setLoading(true);
    try {
        const response = await fetch('/.netlify/functions/edit-pick', {
            method: 'POST',
            body: JSON.stringify({
                pick_id: selectedPick.id,
                new_selected_team: newPick
            })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        toast({ title: 'Pick updated successfully!', status: 'success' });
    } catch (error) {
        toast({ title: 'Error updating pick', description: error.message, status: 'error' });
    } finally {
        setLoading(false);
    }
  };

  return (
    <VStack spacing={4} align="stretch">
      <Heading size="md">Edit a Player's Pick</Heading>
      <FormControl>
        <FormLabel>Select Player</FormLabel>
        <Select placeholder="Select player" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
          {users.map(user => <option key={user.id} value={user.id}>{user.username}</option>)}
        </Select>
      </FormControl>
      <FormControl>
        <FormLabel>Select Week</FormLabel>
        <Select placeholder="Select week" value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)}>
          {weeks.map(week => <option key={week} value={week}>Week {week}</option>)}
        </Select>
      </FormControl>
      {selectedWeek && (
        <FormControl>
          <FormLabel>Select Game</FormLabel>
          <Select placeholder="Select game" value={selectedGameId} onChange={(e) => setSelectedGameId(e.target.value)}>
            {games.map(game => <option key={game.id} value={game.id}>{game.away_team} @ {game.home_team}</option>)}
          </Select>
        </FormControl>
      )}
      {selectedPick ? (
        <>
            <Text>Current Pick: <strong>{selectedPick.selected_team}</strong></Text>
            <FormControl>
                <FormLabel>New Pick</FormLabel>
                <Select value={newPick} onChange={(e) => setNewPick(e.target.value)}>
                    <option value={selectedPick.games.home_team}>{selectedPick.games.home_team}</option>
                    <option value={selectedPick.games.away_team}>{selectedPick.games.away_team}</option>
                </Select>
            </FormControl>
        </>
      ) : (
          selectedUserId && selectedGameId && <Text>No pick found for this player and game.</Text>
      )}
      <Button colorScheme="blue" onClick={handleSubmit} isLoading={loading} isDisabled={!selectedPick}>Update Pick</Button>
    </VStack>
  );
};

const CorrectScoreForm = () => {
    const toast = useToast();
    const [weeks, setWeeks] = useState([]);
    const [games, setGames] = useState([]);

    const [selectedWeek, setSelectedWeek] = useState('');
    const [selectedGameId, setSelectedGameId] = useState('');
    const [selectedGame, setSelectedGame] = useState(null);
    const [homeScore, setHomeScore] = useState('');
    const [awayScore, setAwayScore] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchWeeks = async () => {
            const { data } = await supabase.from('games').select('week');
            if(data) {
                const uniqueWeeks = [...new Set(data.map(g => g.week))];
                setWeeks(uniqueWeeks.sort((a,b) => a-b));
            }
        };
        fetchWeeks();
    }, []);

    useEffect(() => {
        if (!selectedWeek) return;
        const fetchGames = async () => {
            const { data } = await supabase.from('games').select('*').eq('week', selectedWeek);
            setGames(data || []);
        };
        fetchGames();
    }, [selectedWeek]);

    useEffect(() => {
        if (!selectedGameId) {
            setSelectedGame(null);
            return;
        };
        const game = games.find(g => g.id === parseInt(selectedGameId));
        setSelectedGame(game);
        setHomeScore(game?.home_team_score || '');
        setAwayScore(game?.away_team_score || '');
    }, [selectedGameId, games]);

    const handleSubmit = async () => {
        if (!selectedGame) return;
        setLoading(true);
        try {
            const response = await fetch('/.netlify/functions/correct-game-score', {
                method: 'POST',
                body: JSON.stringify({
                    game_id: selectedGame.id,
                    home_score: parseInt(homeScore),
                    away_score: parseInt(awayScore)
                })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            toast({ title: 'Score corrected successfully!', status: 'success' });
        } catch (error) {
            toast({ title: 'Error correcting score', description: error.message, status: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <VStack spacing={4} align="stretch">
            <Heading size="md">Correct a Game Score</Heading>
            <FormControl>
                <FormLabel>Select Week</FormLabel>
                <Select placeholder="Select week" value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)}>
                    {weeks.map(week => <option key={week} value={week}>Week {week}</option>)}
                </Select>
            </FormControl>
            {selectedWeek && (
                <FormControl>
                    <FormLabel>Select Game</FormLabel>
                    <Select placeholder="Select game" value={selectedGameId} onChange={(e) => setSelectedGameId(e.target.value)}>
                        {games.map(game => <option key={game.id} value={game.id}>{game.away_team} @ {game.home_team}</option>)}
                    </Select>
                </FormControl>
            )}
            {selectedGame && (
                <HStack>
                    <FormControl>
                        <FormLabel>{selectedGame.away_team} Score</FormLabel>
                        <NumberInput value={awayScore} onChange={(val) => setAwayScore(val)}>
                            <NumberInputField />
                        </NumberInput>
                    </FormControl>
                    <FormControl>
                        <FormLabel>{selectedGame.home_team} Score</FormLabel>
                        <NumberInput value={homeScore} onChange={(val) => setHomeScore(val)}>
                            <NumberInputField />
                        </NumberInput>
                    </FormControl>
                </HStack>
            )}
            <Button colorScheme="blue" onClick={handleSubmit} isLoading={loading} isDisabled={!selectedGame}>Update Score</Button>
        </VStack>
    );
};


export default function Admin() {
  return (
    <Box>
      <Heading size="lg" mb={8}>Commissioner Dashboard</Heading>
      <VStack spacing={8} divider={<Divider />}>
        <EditPickForm />
        <CorrectScoreForm />
      </VStack>
    </Box>
  );
}
