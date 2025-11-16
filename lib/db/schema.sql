-- CastBounty Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    fid INTEGER PRIMARY KEY,
    address VARCHAR(42) UNIQUE,
    username VARCHAR(100),
    reputation_score INTEGER DEFAULT 0,
    total_earned_wei NUMERIC(78,0) DEFAULT 0,
    bounties_created INTEGER DEFAULT 0,
    bounties_won INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_address ON users(address);
CREATE INDEX idx_users_reputation ON users(reputation_score DESC);

-- Bounties table
CREATE TABLE bounties (
    id SERIAL PRIMARY KEY,
    blockchain_id INTEGER UNIQUE,
    creator_fid INTEGER NOT NULL REFERENCES users(fid),
    creator_address VARCHAR(42) NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    amount_wei NUMERIC(78,0) NOT NULL,
    deadline TIMESTAMP NOT NULL,
    category VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    winner_address VARCHAR(42),
    cast_hash VARCHAR(66),
    metadata_ipfs VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CHECK (status IN ('ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED')),
    CHECK (category IN ('DESIGN', 'CODE', 'CONTENT', 'RESEARCH', 'TRANSLATION', 'OTHER'))
);

CREATE INDEX idx_bounties_status ON bounties(status);
CREATE INDEX idx_bounties_deadline ON bounties(deadline);
CREATE INDEX idx_bounties_category ON bounties(category);
CREATE INDEX idx_bounties_creator ON bounties(creator_fid);
CREATE INDEX idx_bounties_created_at ON bounties(created_at DESC);
CREATE INDEX idx_bounties_blockchain_id ON bounties(blockchain_id);

-- Submissions table
CREATE TABLE submissions (
    id SERIAL PRIMARY KEY,
    bounty_id INTEGER NOT NULL REFERENCES bounties(id) ON DELETE CASCADE,
    submitter_fid INTEGER NOT NULL REFERENCES users(fid),
    submitter_address VARCHAR(42) NOT NULL,
    content_ipfs VARCHAR(100),
    external_url TEXT,
    description TEXT,
    reply_cast_hash VARCHAR(66),
    is_winner BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT unique_bounty_submission UNIQUE (bounty_id, submitter_fid, created_at)
);

CREATE INDEX idx_submissions_bounty ON submissions(bounty_id);
CREATE INDEX idx_submissions_submitter ON submissions(submitter_fid);
CREATE INDEX idx_submissions_winner ON submissions(is_winner);
CREATE INDEX idx_submissions_created_at ON submissions(created_at DESC);

-- Transactions table
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    bounty_id INTEGER REFERENCES bounties(id),
    tx_hash VARCHAR(66) UNIQUE NOT NULL,
    from_address VARCHAR(42),
    to_address VARCHAR(42),
    amount_wei NUMERIC(78,0),
    tx_type VARCHAR(50) NOT NULL,
    block_number BIGINT,
    timestamp TIMESTAMP,

    CHECK (tx_type IN ('CREATE', 'SUBMIT', 'PAYOUT', 'REFUND', 'CANCEL'))
);

CREATE INDEX idx_transactions_tx_hash ON transactions(tx_hash);
CREATE INDEX idx_transactions_bounty ON transactions(bounty_id);
CREATE INDEX idx_transactions_type ON transactions(tx_type);
CREATE INDEX idx_transactions_timestamp ON transactions(timestamp DESC);

-- Notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_fid INTEGER NOT NULL REFERENCES users(fid),
    bounty_id INTEGER REFERENCES bounties(id),
    notification_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),

    CHECK (notification_type IN ('NEW_SUBMISSION', 'BOUNTY_WON', 'PAYMENT_RECEIVED', 'DEADLINE_SOON', 'BOUNTY_COMPLETED'))
);

CREATE INDEX idx_notifications_user ON notifications(user_fid, is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to bounties table
CREATE TRIGGER update_bounties_updated_at BEFORE UPDATE ON bounties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for analytics

-- Active bounties view
CREATE VIEW active_bounties AS
SELECT
    b.*,
    u.username as creator_username,
    COUNT(s.id) as submission_count
FROM bounties b
LEFT JOIN users u ON b.creator_fid = u.fid
LEFT JOIN submissions s ON b.id = s.bounty_id
WHERE b.status = 'ACTIVE'
GROUP BY b.id, u.username;

-- Top contributors view
CREATE VIEW top_contributors AS
SELECT
    u.fid,
    u.username,
    u.address,
    u.reputation_score,
    u.bounties_won,
    u.total_earned_wei,
    COUNT(s.id) as total_submissions
FROM users u
LEFT JOIN submissions s ON u.fid = s.submitter_fid
GROUP BY u.fid, u.username, u.address, u.reputation_score, u.bounties_won, u.total_earned_wei
ORDER BY u.reputation_score DESC
LIMIT 100;

-- Bounty statistics view
CREATE VIEW bounty_stats AS
SELECT
    category,
    COUNT(*) as total_bounties,
    COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_bounties,
    AVG(amount_wei) as avg_amount_wei,
    SUM(amount_wei) as total_volume_wei
FROM bounties
GROUP BY category;
