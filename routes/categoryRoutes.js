import express from 'express';
import User from '../models/User.js';

const categoryRouter = express.Router();

// POST - Save selected categories
categoryRouter.post("/save", async (req, res) => {
  try {
    const { privyUserId, selectedCategories } = req.body;

    // Validation
    if (!privyUserId) {
      return res.status(400).json({
        success: false,
        message: 'privyUserId is required'
      });
    }
    if (!Array.isArray(selectedCategories) || selectedCategories.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one category must be selected'
      });
    }

    // Upsert user document with categories and set isOnboarded to true
    const data = await User.findOneAndUpdate(
      { privyUserId },
      {
        privyUserId,
        selectedCategories,
        isOnboarded: true,
        updatedAt: new Date()
      },
      {
        upsert: true,
        new: true,
        runValidators: true
      }
    );
    console.log(`Categories saved for user ${privyUserId}:`, selectedCategories);

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

categoryRouter.get("/:privyUserId", async (req, res) => {
  try {
    const { privyUserId } = req.params;
    if (!privyUserId) {
      return res.status(400).json({
        success: false,
        message: 'privyUserId is required'
      });
    }
    const data = await User.findOne({ privyUserId });
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