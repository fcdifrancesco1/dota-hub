import React from 'react';
import HeroMetaView from '../components/HeroMetaView';
import { useApp } from '../context/AppContext';

export default function HeroesPage() {
  const { setSelectedHero } = useApp();

  return (
    <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      <HeroMetaView onSelectHero={setSelectedHero} />
    </div>
  );
}
