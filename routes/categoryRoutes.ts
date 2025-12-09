import express, { Request, Response, Router } from 'express';
import User from '../models/User.js';

const categoryRouter: Router = express.Router();

// Request body interface for saving categories
interface SaveCategoriesRequestBody {
  privyUserId: string;
  selectedCategories: string[];
}

// POST - Save selected categories
categoryRouter.post("/save", async (req: Request<{}, {}, SaveCategoriesRequestBody>, res: Response): Promise<void> => {
  try {
    const { privyUserId, selectedCategories } = req.body;

    // Validation
    if (!privyUserId) {
      res.status(400).json({
        success: false,
        message: 'privyUserId is required'
      });
      return;
    }
    if (!Array.isArray(selectedCategories) || selectedCategories.length === 0) {
      res.status(400).json({
        success: false,
        message: 'At least one category must be selected'
      });
      return;
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
  } catch (err: any) {
   console.error('Error saving categories:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to save categories',
      error: err.message
    });
  }
});

categoryRouter.get("/:privyUserId", async (req: Request<{ privyUserId: string }>, res: Response): Promise<void> => {
  try {
    const { privyUserId } = req.params;
    if (!privyUserId) {
      res.status(400).json({
        success: false,
        message: 'privyUserId is required'
      });
      return;
    }
    const data = await User.findOne({ privyUserId });
    if (!data) {
      res.status(404).json({
        success: false,
        message: 'No categories found for this user',
        data: null
      });
      return;
    }
    res.status(200).json({
      success: true,
      data
    });
  } catch (err: any) {
    console.error('Error fetching categories:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: err.message
    });
  }
});

export default categoryRouter;
