-- Separate database used by Jest/Supertest and CI (never the dev database).
SELECT 'CREATE DATABASE inside_test'
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'inside_test')\gexec
