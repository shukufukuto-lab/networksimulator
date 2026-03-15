"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./GlobalNav.module.css";

const TABS = [
  { label: "概要", href: "/" },
  { label: "演習", href: "/exercises" },
  { label: "フリー", href: "/simulation" },
] as const;

export default function GlobalNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav}>
      <span className={styles.title}>Network Simulator</span>
      <div className={styles.tabs}>
        {TABS.map((tab) => {
          const isActive =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`${styles.tab} ${isActive ? styles.active : ""}`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
