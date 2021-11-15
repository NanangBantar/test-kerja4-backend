const express = require("express");
const router = express.Router();
const axios = require("axios");

router.get("/getcountry", async (req, res) => {
    try {
        const country = await axios.get("https://restcountries.com/v3.1/all");
        return res.json(country.data);
    } catch (error) {
        return res.json({
            "title": "failed",
            "text": "Server Error"
        });
    }
});

module.exports = router;