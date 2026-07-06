'use client';

import { useState } from 'react';
import NavSection from './NavSection';
import styles from './Sidebar.module.css';

const NAV_SECTIONS = [
  {
    title: 'Birding',
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
    <>
      <aside className={styles.sidebar}>
        <p className={styles.siteName}>Bird Compendium</p>
        <nav className={styles.nav}>
          {NAV_SECTIONS.map((section) => (
            <NavSection key={section.title} title={section.title} links={section.links} />
          ))}
        </nav>
      </aside>

      <header className={styles.topbar}>
        <p className={styles.siteName}>Bird Compendium</p>
        <button
          type="button"
          className={styles.hamburgerButton}
          aria-label="Toggle navigation"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
        >
          ☰
        </button>
      </header>

      <div
        className={`${styles.backdrop} ${isOpen ? styles.open : ''}`}
        onClick={close}
        aria-hidden="true"
      />

      <aside className={`${styles.mobileNav} ${isOpen ? styles.open : ''}`}>
        <nav className={styles.nav}>
          {NAV_SECTIONS.map((section) => (
            <NavSection
              key={section.title}
              title={section.title}
              links={section.links}
              onLinkClick={close}
            />
          ))}
        </nav>
      </aside>
    </>
  );
}
