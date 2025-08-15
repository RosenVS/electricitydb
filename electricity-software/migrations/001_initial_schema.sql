-- Electricity Trading Platform Database Setup
-- This script will create the database and all necessary tables

-- First, connect to postgres database (which always exists)
\c postgres;

-- Create database if it doesn't exist
-- Note: This will fail if database already exists, but that's okay
CREATE DATABASE electricitydb;

-- Connect to our target database
\c electricitydb;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User energy table (in MWh)
CREATE TABLE IF NOT EXISTS user_energy (
    user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    energy_mwh NUMERIC(15,6) NOT NULL DEFAULT 10000 -- energy amount in MWh
);

-- User money table (in EUR)
CREATE TABLE IF NOT EXISTS user_money (
    user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    money_eur NUMERIC(15,2) NOT NULL DEFAULT 10000 -- starting money 10,000 EUR
);

-- Price per MWh (could be a config or history table)
CREATE TABLE IF NOT EXISTS price_per_mwh (
    id SERIAL PRIMARY KEY,
    price_eur NUMERIC(10,2) NOT NULL, -- price €/MWh
    effective_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default price for example
INSERT INTO price_per_mwh(price_eur) VALUES (100) ON CONFLICT DO NOTHING; -- e.g. 100 €/MWh

-- Orders table: buy/sell orders by users
DO $$ BEGIN
    CREATE TYPE order_type AS ENUM ('buy', 'sell');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    order_type order_type NOT NULL,
    amount_mwh NUMERIC(15,6) NOT NULL CHECK (amount_mwh > 0), -- how much energy to buy/sell
    price_eur_per_mwh NUMERIC(10,2) NOT NULL, -- price user wants
    status VARCHAR(50) NOT NULL DEFAULT 'open', -- open, completed, canceled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table: log of buy/sell execution per user
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    order_id INT REFERENCES orders(id) ON DELETE SET NULL,
    transaction_type order_type NOT NULL,
    amount_mwh NUMERIC(15,6) NOT NULL,
    price_eur_per_mwh NUMERIC(10,2) NOT NULL,
    total_eur NUMERIC(15,2) NOT NULL, -- amount_mwh * price_eur_per_mwh
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_type_status ON orders(order_type, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at); 