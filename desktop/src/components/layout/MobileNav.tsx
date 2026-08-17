import React from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { Compass, Download, Home, Library, Search, Star } from '../../lib/icons';

type IconCmp = React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;

const navItems: { to: string; icon: IconCmp; label: string }[] = [
  { to: '/home', icon: Home, label: 'nav.home' },
  { to: '/search', icon: Search, label: 'nav.search' },
  { to: '/discover', icon: Compass, label: 'nav.discover' },
  { to: '/library', icon: Library, label: 'nav.library' },
  { to: '/star', icon: Star, label: 'nav.star' },
  { to: '/offline', icon: Download, label: 'nav.offline' },
];

/** Bottom tab bar for narrow (phone-width) viewports — mirrors Sidebar's nav
 *  items. Hidden at `md` and above, where Sidebar takes over. Sits above the
 *  floating NowPlayingBar dock (see AppShell's z-index / spacing). */
export const MobileNav = React.memo(() => {
  const { t } = useTranslation();

  return (
    <nav
      className="md:hidden fixed left-0 right-0 bottom-0 z-[51] flex items-stretch justify-around border-t border-white/[0.06] bg-[#0a0a0c]/92 backdrop-blur-xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
              isActive ? 'text-accent' : 'text-white/45'
            }`
          }
        >
          <item.icon size={20} strokeWidth={1.9} />
          <span className="truncate">{t(item.label)}</span>
        </NavLink>
      ))}
    </nav>
  );
});
