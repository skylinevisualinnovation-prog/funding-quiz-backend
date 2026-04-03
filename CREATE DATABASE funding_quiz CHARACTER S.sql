CREATE DATABASE funding_quiz CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'quiz_user'@'localhost' IDENTIFIED BY 'SecurePassword123!';
GRANT ALL PRIVILEGES ON funding_quiz.* TO 'quiz_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
