import mongoose from 'mongoose';

const userCategorySchema = new mongoose.Schema({
    userId: {
        type:String,
        required:true,
        unique:true
    },
    selectedCategories: [String],
}, { timestamps: true })

const UserCategory = mongoose.model('UserCategory',userCategorySchema);

export default UserCategory;