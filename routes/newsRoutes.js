import express from "express";
import axios from "axios";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const response = await axios.get(
      "https://gnews.io/api/v4/search",
      {
        params: {
          q: "الأردن",
          lang: "ar",
          country: "jo",
          max: 10,
          apikey: process.env.GNEWS_API_KEY,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error(
      "GNews Error:",
      error.response?.data || error.message
    );

    res.status(500).json({
      message: "Failed to fetch news",
    });
  }
});

export default router;