
-- =========================================
-- 1. TABLE USERS
-- =========================================

CREATE TABLE users (
                       id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

                       first_name VARCHAR(100) NOT NULL,
                       last_name VARCHAR(100) NOT NULL,

                       email VARCHAR(255) NOT NULL UNIQUE,
                       password_hash TEXT NOT NULL,

                       role VARCHAR(20) NOT NULL DEFAULT 'user'
                           CHECK (role IN ('user', 'admin')),

                       created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                       updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- =========================================
-- 2. TABLE POLLS
-- =========================================

CREATE TABLE polls (
                       id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

                       title VARCHAR(255) NOT NULL,
                       description TEXT,

                       status VARCHAR(20) NOT NULL DEFAULT 'draft'
                           CHECK (status IN ('draft', 'published', 'closed')),

                       created_by BIGINT NOT NULL,

                       starts_at TIMESTAMP WITH TIME ZONE,
                       ends_at TIMESTAMP WITH TIME ZONE,

                       created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                       updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

                       CONSTRAINT fk_poll_creator
                           FOREIGN KEY (created_by)
                               REFERENCES users(id)
                               ON DELETE RESTRICT,

                       CONSTRAINT check_poll_dates
                           CHECK (
                               starts_at IS NULL
                                   OR ends_at IS NULL
                                   OR ends_at > starts_at
                               )
);


-- =========================================
-- 3. TABLE POLL_OPTIONS
-- =========================================

CREATE TABLE poll_options (
                              id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

                              poll_id BIGINT NOT NULL,

                              option_text VARCHAR(255) NOT NULL,

                              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

                              CONSTRAINT fk_option_poll
                                  FOREIGN KEY (poll_id)
                                      REFERENCES polls(id)
                                      ON DELETE CASCADE,

                              CONSTRAINT unique_option_per_poll
                                  UNIQUE (id, poll_id)
);


-- =========================================
-- 4. TABLE VOTES
-- =========================================

CREATE TABLE votes (
                       id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

                       user_id BIGINT NOT NULL,
                       poll_id BIGINT NOT NULL,
                       option_id BIGINT NOT NULL,

                       voted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

                       CONSTRAINT fk_vote_user
                           FOREIGN KEY (user_id)
                               REFERENCES users(id)
                               ON DELETE CASCADE,

                       CONSTRAINT fk_vote_option
                           FOREIGN KEY (option_id, poll_id)
                               REFERENCES poll_options(id, poll_id)
                               ON DELETE CASCADE,

    -- Un utilisateur ne peut voter qu'une seule fois
    -- dans un même sondage.
                       CONSTRAINT unique_user_vote
                           UNIQUE (user_id, poll_id)
);


-- =========================================
-- 5. TABLE NOTIFICATIONS
-- =========================================

CREATE TABLE notifications (
                               id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

                               user_id BIGINT NOT NULL,

                               title VARCHAR(255) NOT NULL,
                               message TEXT NOT NULL,

                               is_read BOOLEAN NOT NULL DEFAULT FALSE,

                               created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

                               CONSTRAINT fk_notification_user
                                   FOREIGN KEY (user_id)
                                       REFERENCES users(id)
                                       ON DELETE CASCADE
);


-- =========================================
-- INDEXES
-- =========================================

CREATE INDEX idx_polls_creator
    ON polls(created_by);

CREATE INDEX idx_polls_status
    ON polls(status);

CREATE INDEX idx_options_poll
    ON poll_options(poll_id);

CREATE INDEX idx_votes_poll
    ON votes(poll_id);

CREATE INDEX idx_notifications_user
    ON notifications(user_id);
