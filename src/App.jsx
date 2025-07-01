import { useAuth } from './context/AuthContext.jsx'
import Auth from './components/Auth.jsx'
// Import the new components
import GameList from './components/GameList.jsx'
import Leaderboard from './components/Leaderboard.jsx'

function App() {
  const { session, user, signOut } = useAuth();

  return (
    <div className="App">
      {!session ? (
        <Auth />
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1>Welcome, {user?.email}!</h1>
            <button onClick={signOut}>Sign Out</button>
          </div>
          <hr />
          {/* Add the new components here */}
          <Leaderboard />
          <GameList />
        </div>
      )}
    </div>
  );
}

export default App;