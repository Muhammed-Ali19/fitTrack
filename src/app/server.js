// server.js
import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import bcrypt from 'bcrypt';

const app = express(); // <-- app doit être défini avant usage
app.use(cors());
app.use(express.json());

app.get('/test', (req, res) => {
    res.send('Serveur Express OK !');
});

// Test simple pour voir si Express fonctionne
app.get('/', (req, res) => {
    res.send('Express fonctionne !');
});

// Connexion MySQL
const db = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'ton_mdp', // change ici
    database: 'fittrack',
    port: 3306
});

db.connect(err => {
    if (err) throw err;
    console.log('Connecté à MySQL !');
});

// Inscription minimaliste
app.post('/register', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email et mot de passe requis" });

    try {
        const hashed = await bcrypt.hash(password, 10);
        db.query(
            'INSERT INTO users (email, password) VALUES (?, ?)',
            [email, hashed],
            (err, result) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: 'Utilisateur créé !', id: result.insertId });
            }
        );
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(5000, () => console.log('Serveur lancé sur http://localhost:5000'));
