'use client';

import { useState } from 'react';
import NavSection from './NavSection';
import styles from './Sidebar.module.css';

const NAV_SECTIONS = [
  {
    title: null,
    links: [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/', label: 'Compendium' },
      { href: '/map', label: 'Map' },
    ],
  },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  const close = () => setIsOpen(false);

  return (
    <header className={styles.header}>
      <div className={styles.headerTop}>
        <p className={styles.siteName}>
          Field notes <span className={styles.siteNameAccent}>— birds</span>
        </p>

        <p className={`${styles.location} mono`}>PLATTSBURGH, NY · 44.69°N</p>

        <button
          type="button"
          className={styles.hamburgerButton}
          aria-label="Toggle navigation"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
        >
          ☰
        </button>
      </div>

      <nav className={`${styles.nav} ${isOpen ? styles.navOpen : ''}`}>
        {NAV_SECTIONS.map((section) => (
          <NavSection
            key={section.title ?? 'main'}
            title={section.title}
            links={section.links}
            onLinkClick={close}
          />
        ))}
      </nav>
    </header>
  );
}
