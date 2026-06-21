async function loadData() {

    try {

        const response = await fetch('/api/stats');
        const data = await response.json();

        document.getElementById('totalCommits').textContent =
            data.totalCommits || 0;

        document.getElementById('developers').textContent =
            data.developers || 0;

        const authorsContainer =
            document.getElementById('authors');

        authorsContainer.innerHTML = '';

        (data.topAuthors || []).forEach((author, index) => {

            let medal = '⚔';

            if(index === 0) medal = '🥇';
            if(index === 1) medal = '🥈';
            if(index === 2) medal = '🥉';

            authorsContainer.innerHTML += `
                <div class="author">
                    <strong>${medal} ${author.author}</strong>
                    <br>
                    ${author.commits} commits
                </div>
            `;

        });

        renderCommits(data.commits || []);

    } catch(err) {

        console.error(err);

    }
}

function renderCommits(commits) {

    const container =
        document.getElementById('commits');

    container.innerHTML = '';

    commits.forEach(commit => {

        container.innerHTML += `
            <div class="commit">

                <h3>
                    ⚔ ${commit.author}
                </h3>

                <p>
                    ${commit.message}
                </p>

                <small>
                    🏰 ${commit.repository || 'Royaume RPG'}
                </small>

                <small>
                    🌿 ${commit.branch || 'main'}
                </small>

                <small>
                    📅 ${new Date(commit.date)
                        .toLocaleString()}
                </small>

                <br><br>

                <a
                    href="${commit.url}"
                    target="_blank"
                    style="
                        color:#ffb347;
                        text-decoration:none;
                    "
                >
                    Voir le commit →
                </a>

            </div>
        `;

    });

}

document
.getElementById('search')
.addEventListener('input', async e => {

    const term =
        e.target.value.toLowerCase();

    const response =
        await fetch('/api/stats');

    const data =
        await response.json();

    const filtered =
        data.commits.filter(commit =>
            commit.message
            .toLowerCase()
            .includes(term)
        );

    renderCommits(filtered);

});

loadData();

setInterval(() => {

    loadData();

}, 10000);