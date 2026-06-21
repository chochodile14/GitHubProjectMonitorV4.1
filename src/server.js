require('dotenv').config({
    path: require('path').join(__dirname, '..', '.env')
});
console.log('DB URL dans database.js =', process.env.DATABASE_URL);
console.log('DATABASE_URL =', process.env.DATABASE_URL);
const express = require('express');
const axios = require('axios');
const path = require('path');
const { pool, initDatabase } = require('./database');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

/*
|--------------------------------------------------------------------------
| WhatsApp
|--------------------------------------------------------------------------
*/

async function sendWhatsApp(message) {

    try {

        await axios.post(
            `https://7107.api.greenapi.com/waInstance${process.env.GREEN_API_INSTANCE}/sendMessage/${process.env.GREEN_API_TOKEN}`,
            {
                chatId: process.env.WHATSAPP_GROUP_ID,
                message
            }
        );

        console.log('✅ WhatsApp envoyé');

    } catch (err) {

        console.error('❌ Erreur WhatsApp');
        console.error(err.response?.data || err.message);

    }
}

/*
|--------------------------------------------------------------------------
| API STATS
|--------------------------------------------------------------------------
*/

app.get('/api/stats', async (req, res) => {

    const total =
        await pool.query(
            'SELECT COUNT(*) FROM commits'
        );

    const developers =
        await pool.query(
            'SELECT COUNT(DISTINCT author) FROM commits'
        );

    const topAuthors =
        await pool.query(`
            SELECT author,
                   COUNT(*) as commits
            FROM commits
            GROUP BY author
            ORDER BY commits DESC
            LIMIT 10
        `);

    const commits =
        await pool.query(`
            SELECT *
            FROM commits
            ORDER BY id DESC
            LIMIT 100
        `);

    res.json({
        totalCommits: Number(total.rows[0].count),
        developers: Number(developers.rows[0].count),
        topAuthors: topAuthors.rows,
        commits: commits.rows
    });

});

/*
|--------------------------------------------------------------------------
| API AUTHORS
|--------------------------------------------------------------------------
*/

app.get('/api/activity', async (req, res) => {

    const activity = await pool.query(`
        SELECT
            DATE(date) as day,
            COUNT(*) as commits
        FROM commits
        GROUP BY day
        ORDER BY day DESC
        LIMIT 30
    `);

    res.json(activity.rows);

});

/*
|--------------------------------------------------------------------------
| API ACTIVITY
|--------------------------------------------------------------------------
*/

app.get('/api/activity', (req, res) => {

    const activity =
        db.prepare(`
            SELECT
                substr(date,1,10) as day,
                COUNT(*) as commits
            FROM commits
            GROUP BY day
            ORDER BY day DESC
            LIMIT 30
        `)
        .all();

    res.json(activity);

});

/*
|--------------------------------------------------------------------------
| WEBHOOK GITHUB
|--------------------------------------------------------------------------
*/

app.post('/webhook/github', async (req, res) => {

    const payload = req.body;

    if (payload.commits) {

        for (const c of payload.commits) {

            await pool.query(
                `
                INSERT INTO commits
                (author, branch, repository, message, url, date)
                VALUES ($1,$2,$3,$4,$5,$6)
                `,
                [
                    c.author.name,
                    payload.ref || 'main',
                    payload.repository?.name || 'unknown',
                    c.message,
                    c.url,
                    new Date()
                ]
            );

            await sendWhatsApp(`
🔥 Nouvelle mise à jour du Royaume RPG

👤 ${c.author.name}

⚔ Branche : ${payload.ref || 'main'}

📜 ${c.message}

🔗 ${c.url}
`);

            console.log(
                '📦 Commit reçu :',
                c.author.name,
                '-',
                c.message
            );
        }
    }

    res.sendStatus(200);

});

/*
|--------------------------------------------------------------------------
| HOME
|--------------------------------------------------------------------------
*/

app.get('/', (req, res) => {

    res.sendFile(
        path.join(__dirname, '..', 'public', 'index.html')
    );

});

/*
|--------------------------------------------------------------------------
| START SERVER
|--------------------------------------------------------------------------
*/

const PORT = process.env.PORT || 3000;

initDatabase().then(() => {

    app.listen(process.env.PORT || 3000, () => {

        console.log('');
        console.log('🔥 RPG Project Monitor V4.1');
        console.log('🌐 Serveur lancé');

    });

});