import Link from 'next/link';
import styles from './Sidebar.module.css';

export default function NavSection({ title, links, onLinkClick }) {
  return (
    <div className={styles.navSection}>
      <p className={styles.sectionTitle}>{title}</p>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={styles.navLink}
          onClick={onLinkClick}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}
