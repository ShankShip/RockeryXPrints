import mongoose from 'mongoose';
import { Category } from "../models/category.model.js";
import { Collection } from "../models/collection.model.js";
import { Product } from "../models/product.model.js";
import { Review } from "../models/reviews.model.js";
import { Order } from "../models/order.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";

const addCategory = asyncHandler(async (req, res) => {
    const {name} = req.body

    if (!name) {
        throw new ApiError(400, "Enter the Category name.")
    }

    const slug = name.toLowerCase().trim().replaceAll(' ', '-')
    
    const existingCategory = await Category.findOne({ slug });
    
    if (existingCategory) {
        throw new ApiError(400, "Category with this name already exists.");
    }
    
    const coverImagePath = req.files?.coverImage?.[0]?.path

    if (!coverImagePath) {
        throw new ApiError(400, "Upload cover photo for category")
    }

    const coverImage = await uploadOnCloudinary(coverImagePath)

    if (!coverImage) {
        throw new ApiError(500, "Internal occurred while uploading cover photo")
    }

    const category = await Category.create({
        name,
        slug,
        coverImage: coverImage.url
    })

    if (!category) {
        throw new ApiError(500, "Internal Error Occurred")
    }

    return res
    .status(201)
    .json(new ApiResponse(201, category, "Category created Successfully"))
})

const getCategories = asyncHandler(async (req, res) => {
    const filter = req.user?.role === 'admin' ? {} : {productCount: {$gt: 0}}

    const allCategories = await Category.find(filter).lean()

    return res
    .status(200)
    .json(new ApiResponse(200, allCategories.length ? allCategories : [], "Categories fetched successfully"))
})

const deleteCategory = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;

    if (!categoryId) {
        throw new ApiError(400, "Choose a category to delete")
    }

    const existingCategory = await Category.findById(categoryId);
    
    if (!existingCategory) {
        throw new ApiError(404, "Category does not exist.");
    }

    if (existingCategory.productCount > 0) {
        throw new ApiError(400, `Cannot delete. This category still contains ${existingCategory.productCount} products.`);
    }

    if (existingCategory.coverImage) {
        await deleteOnCloudinary(existingCategory.coverImage);
    }

    await existingCategory.deleteOne()

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Category deleted successfully"))
})

const updateCategory = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;
    const { name } = req.body;

    if (!categoryId) {
        throw new ApiError(400, "Category ID is required.");
    }

    const existingCategory = await Category.findById(categoryId);
    if (!existingCategory) {
        throw new ApiError(404, "Category not found.");
    }

    if (name && name.trim() !== existingCategory.name) {
        const slug = name.toLowerCase().trim().replaceAll(' ', '-');
        const duplicate = await Category.findOne({ slug, _id: { $ne: categoryId } });
        if (duplicate) {
            throw new ApiError(400, "Another category with this name already exists.");
        }
        existingCategory.name = name.trim();
        existingCategory.slug = slug;
    }

    const coverImagePath = req.files?.coverImage?.[0]?.path;
    if (coverImagePath) {
        if (existingCategory.coverImage) {
            await deleteOnCloudinary(existingCategory.coverImage);
        }
        const newCoverImage = await uploadOnCloudinary(coverImagePath);
        if (!newCoverImage) {
            throw new ApiError(500, "Error uploading new cover photo");
        }
        existingCategory.coverImage = newCoverImage.url;
    }

    await existingCategory.save();

    return res
    .status(200)
    .json(new ApiResponse(200, existingCategory, "Category updated successfully"));
})

const addProduct = asyncHandler(async (req, res) => {
    const { name, description, mrp, sellingPrice, parentProduct, 
        category, searchTags, sku, stock, deliveryDays, features} = req.body

    if (!name || !description || !mrp || !sellingPrice || !category) {
        throw new ApiError(400, "Enter all required fields")
    }

    const categoryExists = await Category.findById(category);

    if (!categoryExists) {
        throw new ApiError(404, "Selected category does not exist.");
    }

    const slug = name.toLowerCase().trim().replaceAll(' ', '-')

    const existingProduct = await Product.findOne({ $or: [{ name }, { slug }] })

    if (existingProduct) {
        throw new ApiError(400, "Product with this name already exists")
    }

    let parsedFeatures = [];
    if (features) {
        try {
            parsedFeatures = JSON.parse(features); 
        } catch (error) {
            throw new ApiError(400, "Invalid features format. Must be a valid JSON array.");
        }
    }

    const imagesPath = req.files?.images?.map(item => item?.path) || []
    const hoverVideoPath = req.files?.hoverVideo?.[0]?.path

    if (!imagesPath.length) {
        throw new ApiError(400, "Images are required to upload")
    }

    const imageUrls = [];
    for (const path of imagesPath) {
        const result = await uploadOnCloudinary(path);
        if (!result || !result.url) {
            throw new ApiError(500, "Some or all images failed to upload");
        }
        imageUrls.push(result.url);
    }

    let hoverVideoUrl = "";
    if (hoverVideoPath) {
        const hoverVideoResult = await uploadOnCloudinary(hoverVideoPath)
        if (hoverVideoResult && hoverVideoResult.url) {
            hoverVideoUrl = hoverVideoResult.url;
        }
    }

    const product = await Product.create({
        name,
        slug,
        description,
        mrp: Number(mrp),
        sellingPrice: Number(sellingPrice),
        category: categoryExists._id,
        parentProduct: parentProduct || null,
        searchTags,
        sku,
        stock: Number(stock) || 0,
        deliveryDays: Number(deliveryDays),
        images: imageUrls,
        hoverVideo: hoverVideoUrl,
        features: parsedFeatures
    })

    if (!product) {
        throw new ApiError(500, "Internal Error occurred")
    }

    if (!parentProduct) {
        await Category.findByIdAndUpdate(categoryExists._id, {
            $inc: { productCount: 1 }
        });
    }

    return res
    .status(201)
    .json(new ApiResponse(201, product, "Product has been listed successfully"))
})

const updateProduct = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    
    const { name, description, mrp, sellingPrice, category,
        searchTags, sku, stock, deliveryDays, parentProduct, features } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    if (!product.parentProduct && product.category.toString() !== category.toString()) {
        
        const newCategoryExists = await Category.findById(category);
        if (!newCategoryExists) {
            throw new ApiError(400, "Wrong category chosen.");
        }

        await Category.findByIdAndUpdate(product.category, { 
            $inc: { productCount: -1 } 
        });
        
        await Category.findByIdAndUpdate(category, { 
            $inc: { productCount: 1 } 
        });
    }

    let parsedFeatures = [];
    if (features) {
        try {
            parsedFeatures = JSON.parse(features); 
        } catch (error) {
            throw new ApiError(400, "Invalid features format. Must be a valid JSON array.");
        }
    }

    let updatedImages = product.images; 
    let updatedHoverVideo = product.hoverVideo;

    const newImagesPath = req.files?.images?.map(item => item?.path) || [];
    
    if (newImagesPath.length > 0) {
        for (const oldImageUrl of product.images) {
            await deleteOnCloudinary(oldImageUrl);
        }

        const uploadedImages = [];
        for (const path of newImagesPath) {
            const result = await uploadOnCloudinary(path);
            if (result && result.url) {
                uploadedImages.push(result.url);
            }
        }
        updatedImages = uploadedImages;
    }

    const newHoverVideoPath = req.files?.hoverVideo?.[0]?.path;
    if (newHoverVideoPath) {
        if (product.hoverVideo) {
            await deleteOnCloudinary(product.hoverVideo);
        }
        const uploadedHoverVideo = await uploadOnCloudinary(newHoverVideoPath);
        if (uploadedHoverVideo && uploadedHoverVideo.url) {
            updatedHoverVideo = uploadedHoverVideo.url;
        }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        {
            $set: {
                name,
                slug: name.toLowerCase().trim().replaceAll(' ', '-'),
                description,
                mrp: Number(mrp),
                sellingPrice: Number(sellingPrice),
                category, 
                parentProduct: parentProduct || null,
                searchTags,
                sku,
                stock: Number(stock),
                deliveryDays: Number(deliveryDays),
                images: updatedImages,
                hoverVideo: updatedHoverVideo,
                features: parsedFeatures
            }
        },
        { 
            returnDocument: 'after'
         } 
    );

    return res
    .status(200)
    .json(new ApiResponse(200, updatedProduct, "Product updated successfully"));
});

const deleteProduct = asyncHandler(async (req, res) => {
    const { productId } = req.params

    const product = await Product.findById(productId);

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    for (const oldImageUrl of product.images) {
        await deleteOnCloudinary(oldImageUrl);
    }
    if (product.hoverVideo) {
        await deleteOnCloudinary(product.hoverVideo);
    }

    if (!product.parentProduct) {
        await Category.findByIdAndUpdate(product.category, {
            $inc: { productCount: -1 }
        });

        const variants = await Product.find({ parentProduct: product._id });

        for (const variant of variants) {
            for (const img of variant.images) {
                await deleteOnCloudinary(img);
            }
            if (variant.hoverVideo) {
                await deleteOnCloudinary(variant.hoverVideo);
            }
        }

        await Product.deleteMany({ parentProduct: product._id });
    }

    await product.deleteOne();

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Product deleted successfully"))
})

const getProducts = asyncHandler(async (req, res) => {
    const { 
        category, 
        search, 
        page = 1, 
        limit = 12, 
        sort = "newest" 
    } = req.query; 

    // ---------------------------------------------
    // STAGE 1: Filtering ($match)
    // ---------------------------------------------
    const matchStage = { parentProduct: null };

    const isCategoryFilterActive = !!category;
    const isCategoryObjectId = isCategoryFilterActive && mongoose.Types.ObjectId.isValid(category);

    if (isCategoryObjectId) {
        matchStage.category = new mongoose.Types.ObjectId(category);
    }

    if (search) {
        matchStage.$or = [
            { name: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
            { searchTags: { $regex: search, $options: "i" } } 
        ];
    }

    // ---------------------------------------------
    // STAGE 2: Sorting ($sort)
    // ---------------------------------------------
    let sortStage = { createdAt: -1 }; 
    if (sort === "price-low") sortStage = { sellingPrice: 1 };
    if (sort === "price-high") sortStage = { sellingPrice: -1 };

    // ---------------------------------------------
    // THE PIPELINE
    // ---------------------------------------------
    const pipeline = [
        { 
            $match: matchStage 
        },
        {
            // $lookup is the aggregation equivalent of .populate()
            $lookup: {
                from: "categories", // MongoDB automatically lowercases and pluralizes your "Category" model name
                localField: "category",
                foreignField: "_id",
                as: "categoryDetails" // Temporarily store the populated data here
            }
        },
        {
            // $lookup returns an array. $unwind pulls the object out of the array.
            $unwind: "$categoryDetails" 
        }
    ];

    // If category filter is slug or name (not a valid ObjectId), filter post-lookup
    if (isCategoryFilterActive && !isCategoryObjectId) {
        pipeline.push({
            $match: {
                $or: [
                    { "categoryDetails.slug": category },
                    { "categoryDetails.name": { $regex: new RegExp(`^${category}$`, "i") } }
                ]
            }
        });
    }

    pipeline.push({ 
        $sort: sortStage 
    });

    // ---------------------------------------------
    // EXECUTE PAGINATION
    // ---------------------------------------------
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    };

    const aggregate = Product.aggregate(pipeline);
    
    // The plugin runs the pipeline and handles all the math automatically!
    const result = await Product.aggregatePaginate(aggregate, options);

    return res.status(200).json(
        new ApiResponse(200, result, "Products fetched successfully")
    );
});

const getProductBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const product = await Product.findOne({ slug }).populate("category", "name slug");

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    const variants = await Product.find({ parentProduct: product._id })
        .select("name sku sellingPrice mrp stock images hoverVideo");

    let isPurchased = product.isPurchased || false;
    let userReview = null;

    if (req.user) {
        const orderExists = await Order.exists({
            user: req.user._id,
            "orderItems.product": product._id
        });
        isPurchased = !!orderExists || req.user.role === 'admin' || product.isPurchased;

        userReview = await Review.findOne({
            product: product._id,
            user: req.user._id
        });
    }

    const totalRatings = await Review.countDocuments({ product: product._id });

    const productData = {
        ...product.toObject(),
        variants,
        isPurchased,
        userReview,
        totalRatings: totalRatings || product.totalRatings || 0
    };

    return res
    .status(200)
    .json(new ApiResponse(200, productData, "Product and variants fetched successfully"));
});

const addCollection = asyncHandler(async (req, res) => {
    const { name, searchTag, description } = req.body

    if (!name) {
        throw new ApiError(400, "Enter the Collection name.")
    }

    const tag = (searchTag || name).trim()
    const slug = name.toLowerCase().trim().replaceAll(' ', '-')

    const existingCollection = await Collection.findOne({
        $or: [{ name }, { slug }]
    });

    if (existingCollection) {
        throw new ApiError(400, "Collection with this name already exists.");
    }

    const coverImagePath = req.files?.coverImage?.[0]?.path
    const hoverVideoPath = req.files?.hoverVideo?.[0]?.path

    if (!coverImagePath) {
        throw new ApiError(400, "Upload cover photo for collection")
    }

    const coverImage = await uploadOnCloudinary(coverImagePath)

    if (!coverImage) {
        throw new ApiError(500, "Internal error occurred while uploading cover photo")
    }

    let hoverVideoUrl = "";
    if (hoverVideoPath) {
        const uploadedVideo = await uploadOnCloudinary(hoverVideoPath);
        if (uploadedVideo && uploadedVideo.url) {
            hoverVideoUrl = uploadedVideo.url;
        }
    }

    const collection = await Collection.create({
        name,
        slug,
        searchTag: tag,
        coverImage: coverImage.url,
        hoverVideo: hoverVideoUrl,
        description: description || ''
    })

    if (!collection) {
        throw new ApiError(500, "Internal Error Occurred")
    }

    return res
    .status(201)
    .json(new ApiResponse(201, collection, "Collection created Successfully"))
})

const getCollections = asyncHandler(async (req, res) => {
    const allCollections = await Collection.find().lean()

    const collectionsWithCount = await Promise.all(
        allCollections.map(async (col) => {
            const count = await Product.countDocuments({
                searchTags: { $in: [col.searchTag.toLowerCase(), col.slug] }
            });
            return { ...col, productCount: count };
        })
    );

    return res
    .status(200)
    .json(new ApiResponse(200, collectionsWithCount, "Collections fetched successfully"))
})

const deleteCollection = asyncHandler(async (req, res) => {
    const { collectionId } = req.params;

    if (!collectionId) {
        throw new ApiError(400, "Choose a collection to delete")
    }

    const existingCollection = await Collection.findById(collectionId);

    if (!existingCollection) {
        throw new ApiError(404, "Collection does not exist.");
    }

    if (existingCollection.coverImage) {
        await deleteOnCloudinary(existingCollection.coverImage);
    }
    if (existingCollection.hoverVideo) {
        await deleteOnCloudinary(existingCollection.hoverVideo);
    }

    await existingCollection.deleteOne()

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Collection deleted successfully"))
})

const updateCollection = asyncHandler(async (req, res) => {
    const { collectionId } = req.params;
    const { name, searchTag, description } = req.body;

    if (!collectionId) {
        throw new ApiError(400, "Collection ID is required.");
    }

    const existingCollection = await Collection.findById(collectionId);
    if (!existingCollection) {
        throw new ApiError(404, "Collection not found.");
    }

    if (name && name.trim() !== existingCollection.name) {
        const slug = name.toLowerCase().trim().replaceAll(' ', '-');
        const duplicate = await Collection.findOne({ slug, _id: { $ne: collectionId } });
        if (duplicate) {
            throw new ApiError(400, "Another collection with this name already exists.");
        }
        existingCollection.name = name.trim();
        existingCollection.slug = slug;
    }

    if (searchTag) {
        existingCollection.searchTag = searchTag.trim().toLowerCase();
    }

    if (description !== undefined) {
        existingCollection.description = description.trim();
    }

    const coverImagePath = req.files?.coverImage?.[0]?.path;
    if (coverImagePath) {
        if (existingCollection.coverImage) {
            await deleteOnCloudinary(existingCollection.coverImage);
        }
        const newCoverImage = await uploadOnCloudinary(coverImagePath);
        if (!newCoverImage) {
            throw new ApiError(500, "Error uploading new cover photo");
        }
        existingCollection.coverImage = newCoverImage.url;
    }

    const hoverVideoPath = req.files?.hoverVideo?.[0]?.path;
    if (hoverVideoPath) {
        if (existingCollection.hoverVideo) {
            await deleteOnCloudinary(existingCollection.hoverVideo);
        }
        const newHoverVideo = await uploadOnCloudinary(hoverVideoPath);
        if (newHoverVideo) {
            existingCollection.hoverVideo = newHoverVideo.url;
        }
    }

    await existingCollection.save();

    return res
    .status(200)
    .json(new ApiResponse(200, existingCollection, "Collection updated successfully"));
})

const addOrUpdateReview = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const { rating, message } = req.body;

    if (!rating || rating < 1 || rating > 5) {
        throw new ApiError(400, "Rating is mandatory and must be between 1 and 5 stars.");
    }

    if (!message || !message.trim()) {
        throw new ApiError(400, "Review message is required.");
    }

    const product = await Product.findById(productId);
    if (!product) {
        throw new ApiError(404, "Product not found.");
    }

    const orderExists = await Order.exists({
        user: req.user._id,
        "orderItems.product": productId
    });

    const isPurchased = !!orderExists || req.user.role === 'admin' || product.isPurchased;
    if (!isPurchased) {
        throw new ApiError(403, "Only users who have purchased this product can submit a review.");
    }

    const review = await Review.findOneAndUpdate(
        { product: productId, user: req.user._id },
        {
            rating: Number(rating),
            message: message.trim(),
            isVerifiedPurchase: true
        },
        { upsert: true, returnDocument: 'after', runValidators: true }
    );

    await review.populate("user", "fullName name avatar email role");

    const stats = await Review.aggregate([
        { $match: { product: new mongoose.Types.ObjectId(productId) } },
        {
            $group: {
                _id: "$product",
                avgRating: { $avg: "$rating" },
                totalRatings: { $sum: 1 }
            }
        }
    ]);

    const avgRating = stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : Number(rating);
    const totalRatings = stats.length > 0 ? stats[0].totalRatings : 1;

    product.rating = avgRating;
    product.totalRatings = totalRatings;
    await product.save();

    return res
        .status(200)
        .json(new ApiResponse(200, { review, rating: avgRating, totalRatings }, "Review submitted successfully"));
});

const getProductReviews = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const reviews = await Review.find({ product: productId })
        .populate("user", "fullName name avatar email role")
        .sort({ createdAt: -1 });

    const stats = await Review.aggregate([
        { $match: { product: new mongoose.Types.ObjectId(productId) } },
        {
            $group: {
                _id: "$rating",
                count: { $sum: 1 }
            }
        }
    ]);

    const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    stats.forEach(item => {
        ratingBreakdown[item._id] = item.count;
    });

    return res
        .status(200)
        .json(new ApiResponse(200, { reviews, ratingBreakdown, totalRatings: reviews.length }, "Reviews fetched successfully"));
});

const deleteReview = asyncHandler(async (req, res) => {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
        throw new ApiError(404, "Review not found.");
    }

    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new ApiError(403, "You are not authorized to delete this review.");
    }

    const productId = review.product;
    await review.deleteOne();

    const stats = await Review.aggregate([
        { $match: { product: new mongoose.Types.ObjectId(productId) } },
        {
            $group: {
                _id: "$product",
                avgRating: { $avg: "$rating" },
                totalRatings: { $sum: 1 }
            }
        }
    ]);

    const avgRating = stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0;
    const totalRatings = stats.length > 0 ? stats[0].totalRatings : 0;

    await Product.findByIdAndUpdate(productId, { rating: avgRating, totalRatings });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Review deleted successfully"));
});

export {
    addCategory,
    getCategories,
    updateCategory,
    deleteCategory,
    addCollection,
    getCollections,
    updateCollection,
    deleteCollection,
    addProduct,
    updateProduct,
    deleteProduct,
    getProducts,
    getProductBySlug,
    addOrUpdateReview,
    getProductReviews,
    deleteReview
}