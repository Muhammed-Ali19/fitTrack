-- Création de la base de données
CREATE DATABASE
IF NOT EXISTS fittrack;

-- Utilisation de la base
USE fittrack;

-- Création de la table users simple
CREATE TABLE
IF NOT EXISTS users
(
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR
(255) NOT NULL UNIQUE,
    password VARCHAR
(255) NOT NULL
);
