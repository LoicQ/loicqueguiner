import { Geist, Geist_Mono, Fraunces, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import styles from "./layout.module.css";
import Sidebar from "./Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata = {
  title: "Bird Compendium",
  description: "A personal log of bird sightings.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} ${ibmPlexMono.variable}`}
    >
      <body>
        <div className={styles.appShell}>
          <Sidebar />
          <div className={styles.main}>{children}</div>
        </div>
      </body>
    </html>
  );
}
