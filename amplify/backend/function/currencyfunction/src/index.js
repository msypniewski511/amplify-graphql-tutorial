/* Amplify Params - DO NOT EDIT
	ENV
	REGION
Amplify Params - DO NOT EDIT */

const axios = require('axios');

exports.handler = async (event, _, callback) => {
    let apiURL = `https://api.coinlore.com/api/tickers/?start=1&limit=10`;

    if (event.arguments) {
        const { start = 0, limit = 10 } = event.arguments
        apiURL = `https://api.coinlore.com/api/tickers/?start=${start}&limit=${limit}`;
    }

    axios.get(apiURL)
        .then(response => callback(null, [{ "korwa": "korwa" }]))
        .catch(err => callback(null, err))
};
