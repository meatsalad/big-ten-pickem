import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
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
  Divider,
  HStack,
  Input,
  NumberInput,
  NumberInputField,
  Spinner,
  Switch,
} from '@chakra-ui/react';

const LeagueSettingsForm = () => {
    const { session } = useAuth();
    const toast = useToast();
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            const { data } = await supabase
                .from('settings')
                .select('setting_name, is_enabled, value');
            
            if (data) {
                const settingsMap = data.reduce((acc, setting) => {
                    acc[setting.setting_name] = setting;
                    return acc;
                }, {});
                setSettings(settingsMap);
            }
            setLoading(false);
        };
        fetchSettings();
    }, []);

    const handleValueChange = (settingName, newValue) => {
        setSettings(prev => ({
            ...prev,
            [settingName]: { ...prev[settingName], value: newValue }
        }));
    };
    
    const handleToggleChange = (settingName, newEnabledState) => {
         setSettings(prev => ({
            ...prev,
            [settingName]: { ...prev[settingName], is_enabled: newEnabledState }
        }));
    };

    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            const updatePromises = Object.keys(settings).map(key => {
                const setting = settings[key];
                return fetch('/.netlify/functions/update-setting', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}`},
                    body: JSON.stringify({
                        setting_name: setting.setting_name,
                        is_enabled: setting.is_enabled,
                        value: setting.value
                    })
                });
            });
            
            const responses = await Promise.all(updatePromises);

            const failedResponse = responses.find(res => !res.ok);
            if (failedResponse) {
                const errorResult = await failedResponse.json();
                throw new Error(errorResult.message || "An error occurred while saving one or more settings.");
            }

            toast({ title: "Settings Saved!", status: 'success' });
        } catch (error) {
            toast({ title: "Error Saving Settings", description: error.message, status: 'error' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Spinner />;

    return (
        <VStack spacing={4} align="stretch" w="100%">
            <Heading size="md">League Settings</Heading>
            <FormControl>
                <FormLabel>Weekly Buy-In ($)</FormLabel>
                <NumberInput 
                    value={settings.weekly_buy_in?.value || ''}
                    onChange={(val) => handleValueChange('weekly_buy_in', parseInt(val))}
                >
                    <NumberInputField />
                </NumberInput>
            </FormControl>
             <FormControl>
                <FormLabel>Perfect Week Multiplier (e.g., 2 for double)</FormLabel>
                <NumberInput 
                    value={settings.perfect_week_multiplier?.value || ''}
                    onChange={(val) => handleValueChange('perfect_week_multiplier', parseInt(val))}
                >
                    <NumberInputField />
                </NumberInput>
            </FormControl>
            <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="smack-talk-toggle" mb="0">Enable Smack Talk Mode?</FormLabel>
                <Switch 
                    id="smack-talk-toggle" 
                    isChecked={settings.smack_talk_mode?.is_enabled || false}
                    onChange={(e) => handleToggleChange('smack_talk_mode', e.target.checked)}
                />
            </FormControl>
            <Button colorScheme="brand" onClick={handleSaveSettings} isLoading={saving}>
                Save All Settings
            </Button>
        </VStack>
    );
};

const RenameLeagueForm = () => {
    const { user, session } = useAuth();
    const toast = useToast();
    const [myLeagues, setMyLeagues] = useState([]);
    const [selectedLeagueId, setSelectedLeagueId] = useState('');
    const [newName, setNewName] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user) return;
        const fetchOwnedLeagues = async () => {
            const { data } = await supabase
                .from('leagues')
                .select('id, name')
                .eq('creator_id', user.id);
            setMyLeagues(data || []);
        };
        fetchOwnedLeagues();
    }, [user]);

    const handleNameChange = (leagueId) => {
        setSelectedLeagueId(leagueId);
        const league = myLeagues.find(l => l.id === leagueId);
        setNewName(league?.name || '');
    };

    const handleSubmit = async () => {
        if (!selectedLeagueId || !newName) {
            toast({ title: 'Please select a league and provide a new name.', status: 'warning' });
            return;
        }
        setLoading(true);
        try {
            const response = await fetch('/.netlify/functions/rename-league', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    league_id: selectedLeagueId,
                    new_name: newName,
                }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            
            toast({ title: 'League renamed successfully!', status: 'success' });
            const { data } = await supabase.from('leagues').select('id, name').eq('creator_id', user.id);
            setMyLeagues(data || []);

        } catch (error) {
            toast({ title: 'Error renaming league', description: error.message, status: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <VStack spacing={4} align="stretch" w="100%">
            <Heading size="md">Rename a League</Heading>
            <FormControl>
                <FormLabel>Select League</FormLabel>
                <Select placeholder="Select a league you own" value={selectedLeagueId} onChange={(e) => handleNameChange(e.target.value)}>
                    {myLeagues.map(league => <option key={league.id} value={league.id}>{league.name}</option>)}
                </Select>
            </FormControl>
            {selectedLeagueId && (
                <FormControl>
                    <FormLabel>New League Name</FormLabel>
                    <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
                </FormControl>
            )}
            <Button colorScheme="brand" onClick={handleSubmit} isLoading={loading} isDisabled={!selectedLeagueId || !newName}>
                Rename League
            </Button>
        </VStack>
    );
};

const SettleWeekForm = () => {
    const { session } = useAuth();
    const toast = useToast();
    const [weeks, setWeeks] = useState([]);
    const [seasons, setSeasons] = useState([]);
    const [leagues, setLeagues] = useState([]);
    const [selectedWeek, setSelectedWeek] = useState('');
    const [selectedSeason, setSelectedSeason] = useState('');
    const [selectedLeagueId, setSelectedLeagueId] = useState('');
    const [loading, setLoading] = useState(false);
  
    useEffect(() => {
      const fetchOptions = async () => {
        const { data: seasonData } = await supabase.rpc('get_distinct_seasons');
        setSeasons(seasonData?.map(s => s.season) || []);
        const { data: weekData } = await supabase.rpc('get_distinct_weeks');
        setWeeks(weekData?.map(w => w.week) || []);
        const { data: leagueData } = await supabase.from('leagues').select('id, name');
        setLeagues(leagueData || []);
      };
      fetchOptions();
    }, []);
  
    const handleSubmit = async () => {
      if (!selectedSeason || !selectedWeek || !selectedLeagueId) {
        toast({ title: 'Please select a season, week, and league.', status: 'warning' });
        return;
      }
      if (!window.confirm(`Are you sure you want to settle Week ${selectedWeek} for the ${selectedSeason} season? This will grade all picks and cannot be easily undone.`)) {
          return;
      }
      setLoading(true);
      try {
        const response = await fetch('/.netlify/functions/settle-most-recent-week', {
          method: 'POST',
          headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            season: parseInt(selectedSeason),
            week: parseInt(selectedWeek),
            league_id: selectedLeagueId,
          }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        toast({ title: 'Week settled successfully!', status: 'success', duration: 5000, isClosable: true });
      } catch (error) {
        toast({ title: 'Error settling week', description: error.message, status: 'error', duration: 5000, isClosable: true });
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <VStack spacing={4} align="stretch" w="100%">
        <Heading size="md">Settle a Week</Heading>
        <Text fontSize="sm">This action grades all picks for the selected week and league.</Text>
        <HStack>
          <FormControl>
            <FormLabel>Select League</FormLabel>
            <Select placeholder="Select league" value={selectedLeagueId} onChange={(e) => setSelectedLeagueId(e.target.value)}>
              {leagues.map(league => <option key={league.id} value={league.id}>{league.name}</option>)}
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel>Select Season</FormLabel>
            <Select placeholder="Select season" value={selectedSeason} onChange={(e) => setSelectedSeason(e.target.value)}>
              {seasons.map(season => <option key={season} value={season}>{season}</option>)}
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel>Select Week</FormLabel>
            <Select placeholder="Select week" value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)}>
              {weeks.map(week => <option key={week} value={week}>Week {week}</option>)}
            </Select>
          </FormControl>
        </HStack>
        <Button colorScheme="red" onClick={handleSubmit} isLoading={loading} isDisabled={!selectedWeek || !selectedSeason || !selectedLeagueId}>
          Settle Week
        </Button>
      </VStack>
    );
};

const CorrectScoreForm = () => {
    const { session } = useAuth();
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
            const { data } = await supabase.rpc('get_distinct_weeks');
            setWeeks(data?.map(w => w.week) || []);
        };
        fetchWeeks();
    }, []);

    useEffect(() => {
        if (!selectedWeek) {
          setGames([]);
          return;
        };
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
        if (!selectedGame || homeScore === '' || awayScore === '') {
            toast({ title: 'Please select a game and enter both scores.', status: 'warning' });
            return;
        }
        setLoading(true);
        const home = parseInt(homeScore);
        const away = parseInt(awayScore);
        let winningTeam = null; 
        if (home > away) {
            winningTeam = selectedGame.home_team;
        } else if (away > home) {
            winningTeam = selectedGame.away_team;
        }
        try {
          const response = await fetch('/.netlify/functions/correct-game-score', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              gameId: selectedGame.id,
              homeTeamScore: home,
              awayTeamScore: away,
              winningTeam: winningTeam,
            }),
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.message);
          toast({ title: 'Score corrected successfully!', status: 'success' });
        } catch (error) {
          toast({ title: 'Error correcting score', description: error.message, status: 'error' });
        } finally {
          setLoading(false);
        }
    };

    return (
        <VStack spacing={4} align="stretch" w="100%">
            <Heading size="md">Correct a Game Score</Heading>
            <FormControl>
                <FormLabel>Select Week</FormLabel>
                <Select placeholder="Select week" value={selectedWeek} onChange={(e) => { setSelectedGameId(''); setSelectedGame(null); setSelectedWeek(e.target.value); }}>
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
            <Button colorScheme="brand" onClick={handleSubmit} isLoading={loading} isDisabled={!selectedGame}>Update Score</Button>
        </VStack>
    );
};

const EditPickForm = () => {
    const { session } = useAuth();
    const toast = useToast();
    const [users, setUsers] = useState([]);
    const [weeks, setWeeks] = useState([]);
    const [games, setGames] = useState([]);
    const [leagues, setLeagues] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedWeek, setSelectedWeek] = useState('');
    const [selectedGameId, setSelectedGameId] = useState('');
    const [selectedLeagueId, setSelectedLeagueId] = useState('');
    const [selectedPick, setSelectedPick] = useState(null);
    const [newPick, setNewPick] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchInitialData = async () => {
            const { data: usersData } = await supabase.from('profiles').select('id, username');
            setUsers(usersData || []);
            const { data: weeksData } = await supabase.rpc('get_distinct_weeks');
            setWeeks(weeksData?.map(w => w.week) || []);
            const { data: leagueData } = await supabase.from('leagues').select('id, name');
            setLeagues(leagueData || []);
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (!selectedWeek) {
            setGames([]);
            return;
        };
        const fetchGames = async () => {
            const { data } = await supabase.from('games').select('*').eq('week', selectedWeek);
            setGames(data || []);
        };
        fetchGames();
    }, [selectedWeek]);

    useEffect(() => {
        if (!selectedUserId || !selectedGameId || !selectedLeagueId) {
            setSelectedPick(null);
            return;
        };
        const fetchPick = async () => {
            const { data } = await supabase
                .from('picks')
                .select('*, games(home_team, away_team)')
                .eq('user_id', selectedUserId)
                .eq('game_id', selectedGameId)
                .eq('league_id', selectedLeagueId)
                .single();
            setSelectedPick(data);
            setNewPick(data?.selected_team || '');
        };
        fetchPick();
    }, [selectedUserId, selectedGameId, selectedLeagueId]);

    const handleSubmit = async () => {
        if (!selectedPick || !newPick) {
            toast({ title: 'Please select a pick and a new team.', status: 'warning' });
            return;
        }
        setLoading(true);
        try {
            const response = await fetch('/.netlify/functions/edit-pick', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    pickId: selectedPick.id,
                    newSelectedTeam: newPick,
                    league_id: selectedLeagueId
                })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            toast({ title: 'Pick updated successfully!', status: 'success' });
        } catch (error) {
            toast({ title: 'Error updating pick', description: error.message, status: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <VStack spacing={4} align="stretch" w="100%">
            <Heading size="md">Edit a Player's Pick</Heading>
            <FormControl>
                <FormLabel>Select League</FormLabel>
                <Select placeholder="Select league" value={selectedLeagueId} onChange={(e) => setSelectedLeagueId(e.target.value)}>
                    {leagues.map(league => <option key={league.id} value={league.id}>{league.name}</option>)}
                </Select>
            </FormControl>
            <FormControl>
                <FormLabel>Select Player</FormLabel>
                <Select placeholder="Select player" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
                    {users.map(user => <option key={user.id} value={user.id}>{user.username}</option>)}
                </Select>
            </FormControl>
            <FormControl>
                <FormLabel>Select Week</FormLabel> {/* <-- CORRECTED TYPO HERE */}
                <Select placeholder="Select week" value={selectedWeek} onChange={(e) => { setSelectedGameId(''); setSelectedPick(null); setSelectedWeek(e.target.value); }}>
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
                selectedUserId && selectedGameId && selectedLeagueId && <Text>No pick found for this player, game, and league.</Text>
            )}
            <Button colorScheme="brand" onClick={handleSubmit} isLoading={loading} isDisabled={!selectedPick}>Update Pick</Button>
        </VStack>
    );
};


export default function Admin() {
  return (
    <Box maxW="600px" mx="auto">
      <Heading size="lg" mb={8}>Commissioner Dashboard</Heading>
      <VStack spacing={10} divider={<Divider />}>
        <LeagueSettingsForm />
        <RenameLeagueForm />
        <SettleWeekForm />
        <CorrectScoreForm />
        <EditPickForm />
      </VStack>
    </Box>
  );
}