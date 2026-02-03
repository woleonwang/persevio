import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import styles from "./style.module.less";

// Vite: 动态导入 assets/icons 下所有 .tsx 组件
const iconModules = import.meta.glob<{ default: ComponentType }>(
  "../../assets/icons/*.tsx",
  { eager: false }
);

/** 从文件路径得到组件展示名，如 arrow-left.tsx -> ArrowLeft */
function getComponentName(path: string): string {
  const filename = path.replace(/^.*\/([^/]+)\.tsx$/, "$1");
  return filename
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

interface IconItem {
  name: string;
  path: string;
  Component: ComponentType | null;
  error?: string;
}

export default function IconDemo() {
  const [icons, setIcons] = useState<IconItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const paths = Object.keys(iconModules).sort();
    const load = async () => {
      const list: IconItem[] = await Promise.all(
        paths.map(async (path) => {
          const name = getComponentName(path);
          try {
            const mod = await iconModules[path]();
            const Component = mod?.default ?? null;
            return { name, path, Component };
          } catch (e) {
            return {
              name,
              path,
              Component: null,
              error: e instanceof Error ? e.message : "Failed to load",
            };
          }
        })
      );
      setIcons(list);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className={styles.pageWrap}>
      <header className={styles.header}>
        <h1 className={styles.title}>Icon Demo</h1>
        <p className={styles.subtitle}>
          assets/icons 下的图标组件，网格展示，下方为组件名
        </p>
      </header>

      {loading ? (
        <div className={styles.loading}>加载中...</div>
      ) : (
        <div className={styles.iconGrid}>
          {icons.map(({ name, Component, error }) => (
            <div
              key={name}
              className={error ? styles.errorCard : styles.iconCard}
            >
              <div className={styles.iconWrap}>
                {Component ? <Component /> : error ?? "—"}
              </div>
              <span className={styles.iconName}>{name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
