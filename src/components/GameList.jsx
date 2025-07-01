import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function GameList() {
  const [games, setGames] = useState([]);
  const [picks, setPicks] = useState({});
  const { user } = useAuth();
  
  // For now, we'll hardcode the current week. This can be made dynamic later.
  const currentWeek = 1; 

  // This effect runs once to fetch the games for the current week
  useEffect(() => {
    const fetchGames = async () => {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('week', currentWeek)
        .order('game_time', { ascending: true }); // Show games in order

      if (error) {
        console.error('Error fetching games: ', error);
      } else {
        setGames(data);
      }
    };

    fetchGames();
  }, []);

  // This function is called when a user clicks a team button
  const handlePick = async (gameId, selectedTeam) => {
    // Immediately update the UI to show the selection
    setPicks({ ...picks, [gameId]: selectedTeam });

    // Use 'upsert' to either insert a new pick or update an existing one
    // for the same user and game.
    const { error } = await supabase
      .from('picks')
      .upsert(
        { user_id: user.id, game_id: gameId, selected_team: selectedTeam },
        { onConflict: 'user_id, game_id' }
      );

    if (error) {
      alert('Error saving pick: ', error.message);
    }
  };

  return (
    <div>
      <h2>Week {currentWeek} Games</h2>
      {games.length > 0 ? (
        games.map((game) => (
          <div key={game.id} style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}>
            <p>{new Date(game.game_time).toLocaleString()}</p>
            <div>
              <button onClick={() => handlePick(game.id, game.away_team)}>
                {game.away_team} {picks[game.id] === game.away_team && '✅'}
              </button>
              <span> at </span>
              <button onClick={() => handlePick(game.id, game.home_team)}>
                {game.home_team} {picks[game.id] === game.home_team && '✅'}
              </button>
            </div>
          </div>
        ))
      ) : (
        <p>No games scheduled for this week. Add some games to the database!</p>
      )}
    </div>
  );
}