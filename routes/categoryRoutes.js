import express from 'express';
import UserCategory from '../models/UserCategory.js';

const categoryRouter = express.Router();

// POST - Save selected categories
categoryRouter.post("/save", async (req, res) => {
  try {
    const { userId, selectedCategories } = req.body;

    // Validation
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId is required' 
      });
    }
    if (!Array.isArray(selectedCategories) || selectedCategories.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'At least one category must be selected' 
      });
    }

    // Upsert user categories
    const data = await UserCategory.findOneAndUpdate(
      { userId },
      { 
        userId,
        selectedCategories,
        updatedAt: new Date()
      },
      { 
        upsert: true, 
        new: true,
        runValidators: true
      }
    );
    console.log(`Categories saved for user ${userId}:`, selectedCategories);

    res.status(200).json({ 
      success: true, 
      message: 'Categories saved successfully',
      data 
    });
  } catch (err) {
   console.error('Error saving categories:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to save categories',
      error: err.message 
    });
  }
});

categoryRouter.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId is required' 
      });
    }
    const data = await UserCategory.findOne({ userId });
    if (!data) {
      return res.status(404).json({ 
        success: false, 
        message: 'No categories found for this user',
        data: null 
      });
    }
    res.status(200).json({ 
      success: true, 
      data 
    });
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch categories',
      error: err.message 
    });
  }
});

export default categoryRouter;