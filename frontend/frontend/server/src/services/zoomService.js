const axios = require("axios");
const qs = require("qs");

const getZoomAccessToken = async () => {
    const credentials = Buffer.from(`${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`).toString('base64');

    const response = await axios.post(
        `https://zoom.us/oauth/token`,
        qs.stringify({ grant_type: "account_credentials", account_id: process.env.ZOOM_ACCOUNT_ID }),
        {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": `Basic ${credentials}`
            }
        }
    );

    return response.data.access_token;
};

const createZoomMeeting = async (topic) => {
    const token = await getZoomAccessToken();

    const response = await axios.post(
        "https://api.zoom.us/v2/users/me/meetings",
        {
            topic,
            type: 2,
            start_time: new Date().toISOString(),
            duration: 30,
            timezone: "Asia/Kolkata",
            settings: {
                join_before_host: false,
                waiting_room: true
            }
        },
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    return response.data;
};

module.exports = { createZoomMeeting };
