const express = require('express')
const fetch = require('node-fetch');
const redis = require('redis');

const PORT = 3000;
const REDIS_PORT = 6379;

const client = redis.createClient(REDIS_PORT);
const app = express();

function setResponse(username, repos) {
    return `<h2> ${username} has ${repos} github repos </h2>`
}

async function getRepos(req, res) {
    try {
        console.log('Fetching the data');
        const { username } = req.params;
        const response = await fetch(`https://api.github.com/users/${username}`)
        const data = await response.json();
        const repos = data.public_repos;
        //redis
        client.setex(username, 3600, repos, (err, data) => {
            if(err) {
                console.error(err.message);
            } res.send(setResponse(username, repos))
        });
    } catch (error) {
        console.error(error.message);
        res.status(500);
    }
}   

function cache(req, res,next) {
    const { username } = req.params;
    client.get(username, (err, data) => {
        if(err) throw err;
        if(data !== null) {
            res.send(setResponse(username, data))
        } else next();
    })
}

app.get('/repos/:username', cache, getRepos);
app.listen(PORT, () => console.log(`Example app listening on port ${PORT}`))