import Link from 'next/link';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <p className={styles.siteName}>Bird Compendium</p>
      <nav className={styles.nav}>
        <Link href="/dashboard" className={styles.navLink}>Dashboard</Link>
        <Link href="/" className={styles.navLink}>Compendium</Link>
      </nav>
    </aside>
  );
}
