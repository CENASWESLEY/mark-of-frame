export const migrations = [
  {
    version: 1,
    sql: `
      CREATE TABLE titles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL CHECK(length(trim(name)) > 0),
        original_title TEXT NOT NULL DEFAULT '',
        category TEXT NOT NULL,
        release_year INTEGER,
        genres TEXT NOT NULL DEFAULT '[]',
        country TEXT NOT NULL DEFAULT '',
        language TEXT NOT NULL DEFAULT '',
        cover_url TEXT NOT NULL DEFAULT '',
        backdrop_url TEXT NOT NULL DEFAULT '',
        synopsis TEXT NOT NULL DEFAULT '',
        runtime_minutes INTEGER CHECK(runtime_minutes > 0),
        total_episodes INTEGER CHECK(total_episodes > 0),
        is_demo INTEGER NOT NULL DEFAULT 0 CHECK(is_demo IN (0, 1)),
        created_at TEXT NOT NULL
      ) STRICT;
      CREATE TABLE watch_rounds (
        id TEXT PRIMARY KEY,
        title_id TEXT NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
        status TEXT NOT NULL CHECK(status IN ('planned','watching','completed','paused','dropped')),
        score INTEGER CHECK(score BETWEEN 0 AND 1000),
        season INTEGER NOT NULL DEFAULT 1 CHECK(season > 0),
        episode INTEGER NOT NULL DEFAULT 0 CHECK(episode >= 0),
        started_on TEXT,
        finished_on TEXT,
        note TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        CHECK(started_on IS NULL OR finished_on IS NULL OR started_on <= finished_on)
      ) STRICT;
      CREATE INDEX watch_rounds_title ON watch_rounds(title_id);
      CREATE INDEX titles_category ON titles(category);
    `,
  },
  {
    version: 2,
    sql: `
    CREATE TABLE installments (
      id TEXT PRIMARY KEY,
      title_id TEXT NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
      name TEXT NOT NULL CHECK(length(trim(name)) > 0),
      position INTEGER NOT NULL CHECK(position BETWEEN 1 AND 1000),
      release_year INTEGER,
      cover_url TEXT NOT NULL DEFAULT '',
      backdrop_url TEXT NOT NULL DEFAULT '',
      synopsis TEXT NOT NULL DEFAULT '',
      total_episodes INTEGER CHECK(total_episodes > 0),
      UNIQUE(title_id,position), UNIQUE(id,title_id)
    ) STRICT;
    ALTER TABLE watch_rounds ADD COLUMN installment_id TEXT REFERENCES installments(id);
    ALTER TABLE watch_rounds ADD COLUMN source_note TEXT NOT NULL DEFAULT '';
    CREATE INDEX watch_rounds_installment ON watch_rounds(installment_id);
  `,
  },
] as const;
