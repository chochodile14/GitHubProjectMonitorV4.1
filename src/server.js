require('dotenv').config({
    path: require('path').join(__dirname, '..', '.env')
});

const express = require('express');
const axios = require('axios');
const path = require('path');
const db = require('./database');

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

app.get('/api/stats', (req, res) => {

    const totalCommits =
        db.prepare('SELECT COUNT(*) as total FROM commits')
        .get();

    const developers =
        db.prepare(`
            SELECT COUNT(DISTINCT author) as total
            FROM commits
        `)
        .get();

    const lastCommit =
        db.prepare(`
            SELECT *
            FROM commits
            ORDER BY id DESC
            LIMIT 1
        `)
        .get();

    const topAuthors =
        db.prepare(`
            SELECT
                author,
                COUNT(*) as commits
            FROM commits
            GROUP BY author
            ORDER BY commits DESC
            LIMIT 10
        `)
        .all();

    const commits =
        db.prepare(`
            SELECT *
            FROM commits
            ORDER BY id DESC
            LIMIT 100
        `)
        .all();

    res.json({
        totalCommits: totalCommits.total,
        developers: developers.total,
        lastCommit,
        topAuthors,
        commits
    });

});

/*
|--------------------------------------------------------------------------
| API AUTHORS
|--------------------------------------------------------------------------
*/

app.get('/api/authors', (req, res) => {

    const authors =
        db.prepare(`
            SELECT
                author,
                COUNT(*) as commits
            FROM commits
            GROUP BY author
            ORDER BY commits DESC
        `)
        .all();

    res.json(authors);

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

            db.prepare(`
                INSERT INTO commits
                (
                    author,
                    branch,
                    repository,
                    message,
                    url,
                    date
                )
                VALUES (?, ?, ?, ?, ?, ?)
            `).run(
                c.author.name,
                payload.ref || 'main',
                payload.repository?.name || 'unknown',
                c.message,
                c.url,
                new Date().toISOString()
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

app.listen(PORT, () => {

    console.log('');
    console.log('🔥 RPG Project Monitor V4.1');
    console.log(`🌐 http://localhost:${PORT}`);
    console.log('');

});