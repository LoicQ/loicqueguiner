'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';

export default function NavSection({ title, links, onLinkClick }) {
  const pathname = usePathname();

  return (
    <div className={styles.navSection}>
      {title ? <p className={styles.sectionTitle}>{title}</p> : null}
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`${styles.navLink} mono ${isActive ? styles.active : ''}`}
            onClick={onLinkClick}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
