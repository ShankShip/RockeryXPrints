import { Router } from "express";
import { jwtVerifier, optionalJwtVerifier } from "../middleware/jwt.middleware.js";
import { adminCheck } from "../middleware/admin.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import { addCategory, addCollection, addOrUpdateReview, addProduct, deleteCategory, deleteCollection, deleteProduct, deleteReview, getCategories, getCollections, getProductBySlug, getProductReviews, getProducts, updateCategory, updateCollection, updateProduct } from "../controllers/product.controller.js";

const prodRouter = Router()

prodRouter.route('/categories').get(optionalJwtVerifier, getCategories)
prodRouter.route('/collections').get(getCollections)
prodRouter.route('/products').get(getProducts)
prodRouter.route('/products/:slug').get(optionalJwtVerifier, getProductBySlug)
prodRouter.route('/products/:productId/reviews').get(getProductReviews)
prodRouter.route('/products/:productId/reviews').post(jwtVerifier, addOrUpdateReview)
prodRouter.route('/reviews/:reviewId').delete(jwtVerifier, deleteReview)

prodRouter.use(jwtVerifier, adminCheck)

prodRouter.route('/admin/categories').get(getCategories)
prodRouter.route('/admin/collections').get(getCollections)

prodRouter.route('/add-category').post(
    upload.fields([{
        name: "coverImage", 
        maxCount: 1 
    }]), 
    addCategory
)

prodRouter.route('/update-category/:categoryId').post(
    upload.fields([{ name: "coverImage", maxCount: 1 }]), 
    updateCategory
)

prodRouter.route('/delete-category/:categoryId').delete(deleteCategory)

prodRouter.route('/add-collection').post(
    upload.fields([
        { name: "coverImage", maxCount: 1 },
        { name: "hoverVideo", maxCount: 1 }
    ]), 
    addCollection
)

prodRouter.route('/update-collection/:collectionId').post(
    upload.fields([
        { name: "coverImage", maxCount: 1 },
        { name: "hoverVideo", maxCount: 1 }
    ]), 
    updateCollection
)

prodRouter.route('/delete-collection/:collectionId').delete(deleteCollection)

prodRouter.route('/add-product').post(upload.fields([
        { name: "images", maxCount: 10 },
        { name: "hoverVideo", maxCount: 1 }
    ]), 
    addProduct
)

prodRouter.route('/update-product/:productId').post(upload.fields([
        { name: "images", maxCount: 10 },
        { name: "hoverVideo", maxCount: 1 }
    ]), 
    updateProduct
)

prodRouter.route('/delete-product/:productId').delete(deleteProduct)

export {prodRouter}