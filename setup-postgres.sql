-- Create database and user for SMS application
CREATE DATABASE sms_db;

-- Create a dedicated user (optional, you can use postgres user)
CREATE USER sms_user WITH PASSWORD 'sms_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE sms_db TO sms_user;

-- Connect to the database
\c sms_db;

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO sms_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO sms_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO sms_user;
