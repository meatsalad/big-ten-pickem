import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      // Fetch all picks that are marked as correct, along with the user's profile
      const { data, error } = await supabase
        .from('picks')
        .select(`
          is_correct,
          profiles ( username )
        `)
        .eq('is_correct', true);

      if (error) {
        console.error('Error fetching leaderboard data:', error);
        return;
      }

      // Tally the scores
      const scores = data.reduce((acc, pick) => {
        const username = pick.profiles.username;
        acc[username] = (acc[username] || 0) + 1;
        return acc;
      }, {});

      // Sort the users by score in descending order
      const sortedLeaderboard = Object.entries(scores)
        .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
        .map(([username, score]) => ({ username, score }));

      setLeaderboard(sortedLeaderboard);
    };

    fetchLeaderboard();
  }, []);

  return (
    <div>
      <h2>Leaderboard</h2>
      <ol>
        {leaderboard.map((user, index) => (
          <li key={index}>
            {user.username}: {user.score} points
          </li>
        ))}
      </ol>
    </div>
  );
}