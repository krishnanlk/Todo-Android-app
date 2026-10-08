import React from 'react';
import { Smartphone, BarChart2, Settings } from 'lucide-react';
import { APP_CONFIG } from '../config/appConfig';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenReviews: () => void;
  onOpenWidgets: () => void;
  streakCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  onOpenReviews,
  onOpenWidgets,
  streakCount,
}) => {
  const now = new Date();
  const hours = now.getHours();

  let greeting = 'Good morning';
  let emoji = '🌅';
  if (hours >= 12 && hours < 17) {
    greeting = 'Good afternoon';
    emoji = '☀️';
  } else if (hours >= 17 && hours < 22) {
    greeting = 'Good evening';
    emoji = '👋';
  } else if (hours >= 22 || hours < 5) {
    greeting = 'Good night';
    emoji = '🌙';
  }

  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  };
  const formattedDate = now.toLocaleDateString('en-US', dateOptions);

  return (
    <header className="px-5 pt-4 pb-2">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <img
                src="/app-logo.png"
                alt="LineUp"
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 7,
                  objectFit: 'contain',
                  boxShadow: '0 2px 10px rgba(24, 96, 240, 0.45)',
                }}
              />
              {APP_CONFIG.name}
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-medium mt-0.5">{formattedDate}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Android Widgets Hub Button */}
          <button
            onClick={onOpenWidgets}
            title="Android Home Widgets"
            className="w-9 h-9 rounded-full bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-700 transition"
          >
            <Smartphone size={17} />
          </button>

          {/* AI Reviews Button */}
          <button
            onClick={onOpenReviews}
            title="Weekly & Monthly Reviews"
            className="w-9 h-9 rounded-full bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-700 transition"
          >
            <BarChart2 size={17} />
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            title="Settings"
            className="w-9 h-9 rounded-full bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-700 transition"
          >
            <Settings size={17} />
          </button>
        </div>
      </div>

      <div className="mt-4">
        <h1 className="ios-large-title text-white">
          {greeting} {emoji}
        </h1>
      </div>
    </header>
  );
};
