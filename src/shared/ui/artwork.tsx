"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { Film } from "lucide-react";
import { artworkSource } from "@/shared/lib/artwork-source";
import styles from "./artwork.module.css";

const ArtworkBasePath = createContext("/");

export function ArtworkBasePathProvider({
  basePath,
  children,
}: {
  basePath: string;
  children: ReactNode;
}) {
  return (
    <ArtworkBasePath.Provider value={basePath}>
      {children}
    </ArtworkBasePath.Provider>
  );
}

export function Artwork({
  src,
  title,
  backdrop = false,
  eager = false,
}: {
  src: string;
  title: string;
  backdrop?: boolean;
  eager?: boolean;
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const [wideSource, setWideSource] = useState<string | null>(null);
  const basePath = useContext(ArtworkBasePath);
  return (
    <span
      className={`${styles.artwork} ${backdrop ? styles.backdrop : wideSource === src ? styles.wide : ""}`}
    >
      {src && failedSource !== src ? (
        // User-supplied cover hosts vary; a regular image avoids a server-side arbitrary-host image proxy.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={artworkSource(src, basePath)}
          alt={backdrop ? "" : `ปก ${title}`}
          loading={eager ? "eager" : "lazy"}
          onLoad={(event) => {
            // Official arc key visuals can be wider than a poster; preserve their complete artwork.
            if (
              event.currentTarget.naturalWidth >
              event.currentTarget.naturalHeight * 1.2
            )
              setWideSource(src);
          }}
          onError={() => setFailedSource(src)}
        />
      ) : (
        <span className={styles.placeholder}>
          <Film aria-hidden="true" />
          <span>{title}</span>
        </span>
      )}
    </span>
  );
}
