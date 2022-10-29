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
    console.log('fetching data...');
    const { username } = req.params;
    const response = await fetch(`https://api.github.com/users/${username}`);
    const data = await response.json();

    const repos = data.public_repos;

    // Set data to Redis
    client.set(username, repos, 3600);

    res.send(setResponse(username, repos));
  } catch (err) {
    console.log(err);
    res.status(500);
  }
};

//Cache Middleware
const cache = (req, res, next) => {
  const { username } = req.params;
  client.get(username, (err, data) => {
    if (err) throw err;
    if (data !== null) {
      res.send(setResponse(username, data));
    } else {
      next();
    }
  });
};

app.get('/repos/:username',cache, getRepos);

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
