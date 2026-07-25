import mongoose from 'mongoose'
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true
    },
    description: {
        type: String,
        required: true
    },

    mrp: {
        type: Number,
        required: true,
        min: 0
    },
    sellingPrice: {
        type: Number,
        required: true,
        min: 0
    },

    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    parentProduct: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        default: null
    },
    searchTags: [{
        type: String,
        lowercase: true,
        trim: true
    }],
    features: [
        {
            key: { type: String, required: true },
            value: { type: String, required: true }
        }
    ],
    images: [{
        type: String,
        validate: {
            validator: function(v) { return v && v.length > 0; },
            message: 'A product must have at least one image upload.'
        }
    }],
    hoverVideo: {
        type: String,
        default: ''
    },

    sku: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    stock: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    deliveryDays: {
        type: Number,
        default: 2
    },

    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },

    totalRatings: {
        type: Number,
        default: 0
    },

    isPurchased: {
        type: Boolean,
        default: false
    },

    salesCount: {
        type: Number,
        default: 0,
        index: true
    },

    variants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
    }]
}, {timestamps: true})

productSchema.index({ name: 'text', description: 'text', searchTags: 'text' });

productSchema.plugin(mongooseAggregatePaginate);

export const Product = mongoose.model("Product", productSchema)