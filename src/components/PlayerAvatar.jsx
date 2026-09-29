import React, { useEffect, useState } from 'react';
import { fetchPlayerProfile } from '../services/api';

/**
 * Foto de um jogador profissional. A URL é buscada na OpenDota pelo account_id
 * (Steam) do jogador; enquanto carrega, ou se a conta não tiver foto, exibe um
 * badge estático com as iniciais do nick.
 */
export default function PlayerAvatar({ accountId, name, className = 'w-14 h-14 rounded-xl' }) {
  const [avatar, setAvatar] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setAvatar(null);
    setFailed(false);
    fetchPlayerProfile(accountId).then((profile) => {
      if (active && profile?.avatar) setAvatar(profile.avatar);
    });
    return () => { active = false; };
  }, [accountId]);

  if (!avatar || failed) {
    const initials = String(name || '?').replace(/[^\p{L}\p{N}]/gu, '').slice(0, 2).toUpperCase();
    return (
      <div
        className={`${className} flex items-center justify-center bg-surface-2 border border-white/10 font-mono font-black text-amber-400 select-none`}
        title={name}
      >
        {initials || '?'}
      </div>
    );
  }

  return (
    <img
      src={avatar}
      alt={name}
      title={name}
      className={`${className} object-cover`}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
