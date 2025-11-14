import express from 'express';
import UserCategory from '../models/UserCategory.js';

const categoryRouter = express.Router();

// POST - Save selected categories
categoryRouter.post("/save", async (req, res) => {
  try {
    const { userId, selectedCategories } = req.body;

    // Upsert (create or update)
    const data = await UserCategory.findOneAndUpdate(
      { userId },
      { selectedCategories },
      { upsert: true, new: true }
    );

    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

categoryRouter.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const data = await UserCategory.findOne({ userId });
    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

export default categoryRouter;