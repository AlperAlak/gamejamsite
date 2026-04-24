-- ==============================================================================
--  Karadeniz Game Jam 2026 — Initial PostgreSQL Schema
--  Automatically executed via Docker entrypoint on first boot.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS participants (
    id               SERIAL PRIMARY KEY,
    full_name        VARCHAR(255) NOT NULL,
    email            VARCHAR(255) NOT NULL UNIQUE,
    phone            VARCHAR(50),
    university       VARCHAR(255),
    experience_level VARCHAR(50)  DEFAULT 'beginner',
    motivation       TEXT,
    status           VARCHAR(50)  NOT NULL DEFAULT 'pending',
    ip_address       VARCHAR(45),
    oauth_provider   VARCHAR(50),  -- e.g., 'google', 'github'
    oauth_id         VARCHAR(255), -- User ID from provider

    created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teams (
    id              SERIAL PRIMARY KEY,
    team_name       VARCHAR(255) NOT NULL UNIQUE,
    captain_name    VARCHAR(255) NOT NULL,
    captain_email   VARCHAR(255) NOT NULL UNIQUE,
    captain_phone   VARCHAR(50)  NOT NULL,
    university      VARCHAR(255) NOT NULL,
    member_count    INTEGER      NOT NULL DEFAULT 1,
    status          VARCHAR(50)  NOT NULL DEFAULT 'pending',
    ip_address      VARCHAR(45),

    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_members (
    id        SERIAL PRIMARY KEY,
    team_id   INTEGER      NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email     VARCHAR(255) NOT NULL,
    CONSTRAINT fk_team_member
        FOREIGN KEY(team_id) 
        REFERENCES teams(id) 
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS submissions (
    id              SERIAL PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    game_url        TEXT         NOT NULL,
    source_url      TEXT,
    team_id         INTEGER,
    participant_id  INTEGER,
    status          VARCHAR(50)  NOT NULL DEFAULT 'pending',
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_submission_team
        FOREIGN KEY(team_id) 
        REFERENCES teams(id) 
        ON DELETE SET NULL,
    CONSTRAINT fk_submission_participant
        FOREIGN KEY(participant_id) 
        REFERENCES participants(id) 
        ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(email);
CREATE INDEX IF NOT EXISTS idx_participants_oauth ON participants(oauth_provider, oauth_id);
CREATE INDEX IF NOT EXISTS idx_teams_captain_email ON teams(captain_email);
CREATE INDEX IF NOT EXISTS idx_participants_status ON participants(status);
CREATE INDEX IF NOT EXISTS idx_teams_status ON teams(status);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);

-- ==============================================================================
--  System Settings — Key/Value store for runtime toggles
-- ==============================================================================

CREATE TABLE IF NOT EXISTS system_settings (
    key        VARCHAR(100) PRIMARY KEY,
    value      TEXT         NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Default: registrations are OPEN
INSERT INTO system_settings (key, value)
VALUES ('registration_open', 'true')
ON CONFLICT (key) DO NOTHING;

-- ==============================================================================
--  Sponsors — Categorized sponsor logos for the landing page
--  category: 'main' = Ana Sponsor (prominent grid)
--            'extra' = Ekstra Sponsor (secondary grid)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS sponsors (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    logo_url      TEXT         NOT NULL,
    website_url   TEXT,
    category      VARCHAR(20)  NOT NULL DEFAULT 'main'
                  CHECK (category IN ('main', 'extra')),
    display_order INTEGER      NOT NULL DEFAULT 0,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sponsors_category ON sponsors(category);

