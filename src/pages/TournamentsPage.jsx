import React from 'react';
import TournamentsView from '../components/TournamentsView';
import { useApp } from '../context/AppContext';

export default function TournamentsPage() {
  const { setSelectedSeries } = useApp();

  return (
    <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      <TournamentsView onSelectMatch={setSelectedSeries} />
    </div>
  );
}
