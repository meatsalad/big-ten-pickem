import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      alert(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
        setLoading(true);
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Check your email for the confirmation link!');
    } catch (error) {
        alert(error.error_description || error.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div>
      <h1>Big Ten Pick 'em</h1>
      <p>Sign in or create an account to join the fun.</p>
      <form>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleLogin} disabled={loading}>
          {loading ? <span>Loading...</span> : <span>Login</span>}
        </button>
        <button onClick={handleSignUp} disabled={loading}>
          {loading ? <span>Loading...</span> : <span>Sign Up</span>}
        </button>
      </form>
    </div>
  );
}