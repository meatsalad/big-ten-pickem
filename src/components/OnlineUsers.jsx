import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Text,
  Avatar,
  AvatarGroup,
  Tooltip,
  Link, // Import Chakra's Link
} from '@chakra-ui/react';

export default function OnlineUsers() {
  const { user, profile } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!user || !profile) return;

    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel.on('presence', { event: 'sync' }, () => {
      const presenceState = channel.presenceState();
      
      const users = Object.keys(presenceState)
        .map((presenceId) => {
          const pres = presenceState[presenceId][0];
          return {
            id: pres.user_id,
            username: pres.username,
            avatar_url: pres.avatar_url,
          };
        })
        .filter((u, index, self) => index === self.findIndex((t) => t.id === u.id));

      setOnlineUsers(users);
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: user.id,
          username: profile.username,
          avatar_url: profile.avatar_url,
        });
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [user, profile]);

  return (
    <Box>
      <Text fontSize="xs" color="gray.400" mb={2}>
        Online ({onlineUsers.length})
      </Text>
      <AvatarGroup size="sm" max={5}>
        {onlineUsers.map((onlineUser) => (
          <Tooltip key={onlineUser.id} label={onlineUser.username} placement="top">
            {/* Wrap the Avatar in a Link */}
            <Link as={RouterLink} to={`/profile/${onlineUser.id}`}>
              <Avatar name={onlineUser.username} src={onlineUser.avatar_url} />
            </Link>
          </Tooltip>
        ))}
      </AvatarGroup>
    </Box>
  );
}
