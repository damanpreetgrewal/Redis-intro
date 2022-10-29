const express = require('express');
const fetch = require('node-fetch');
const redis = require('redis');

const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.REDIS_PORT || 6379;

const client = redis.createClient(REDIS_PORT);
client.connect();
client.on('connect', () => {
  console.log('connected');
});

const app = express();

//Set Response
const setResponse = (username, repos) => {
  return `<h2>${username} has ${repos} Github repos</h2>`;
};

//Make Request to github for Data
const getRepos = async (req, res, next) => {
  try {
    console.log('fetching data from backend...');
    const { username } = req.params;
    const response = await fetch(`https://api.github.com/users/${username}`);
    const data = await response.json();

    const repos = data.public_repos;

    // Set data to Redis
    client.SET(username, repos);

    res.send(setResponse(username, repos));
  } catch (err) {
    console.log(err);
    res.status(500);
  }
};

//Cache Middleware
const cache = async (req, res, next) => {
  const { username } = req.params;
  const data = await client.get(username);
  if (data !== null) {
    console.log('fetching data from backend...');
    res.send(setResponse(username, data));
  } else {
    next();
  }
};

app.get('/repos/:username', cache, getRepos);

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
