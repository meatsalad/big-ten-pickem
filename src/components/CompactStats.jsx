import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import {
  HStack,
  Text,
  Stat, // <-- Import Stat
  StatArrow,
  Spinner,
} from '@chakra-ui/react';

export default function CompactStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!user) return;

    const fetchFinancials = async () => {
      const { data, error } = await supabase.rpc('get_user_financials', {
        p_user_id: user.id,
      });

      if (error) {
        console.error('Error fetching financial stats:', error);
      } else if (data && data.length > 0) {
        setStats(data[0]);
      }
    };

    fetchFinancials();
  }, [user]);

  if (!stats) {
    return <Spinner size="xs" color="white" />;
  }

  const net = stats.total_winnings - stats.total_losses;
  const net_type = net >= 0 ? 'increase' : 'decrease';
  const net_color = net >= 0 ? 'green.400' : 'red.400';

  return (
    <HStack>
      {/* Wrap the net total in a <Stat> component */}
      <Stat>
        <HStack>
          <Text fontSize="sm" color="gray.300">
            Season Net:
          </Text>
          <Text fontWeight="bold" color={net_color}>
            <StatArrow type={net_type} />
            ${net}
          </Text>
        </HStack>
      </Stat>
    </HStack>
  );
}
