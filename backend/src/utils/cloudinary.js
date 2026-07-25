import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs'


const uploadOnCloudinary = async (localFilePath) => {
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    try {
        if(!localFilePath) return null

        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {resource_type: "auto"})

        //file has been uploaded successfully
        // console.log("File is uploaded on cloudinary ", response.url)
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation is successful
        return response
    } catch (error) {
        console.log("Error at Cloudinary: ", error)
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null
    }
}

const deleteOnCloudinary = async (imgUrl, resourceType = 'auto') => {
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    try {
        if(!imgUrl) return null

        const urlArray = imgUrl.split('/')
        const img = urlArray[urlArray.length - 1]
        const publicId = img.split('.')[0]

        // Detect if the file is a video by URL extension or resourceType parameter
        const isVideo = imgUrl.match(/\.(mp4|webm|mov|avi|mkv)$/i) || resourceType === 'video';
        const type = isVideo ? 'video' : 'image';

        const response = await cloudinary.uploader.destroy(publicId, { resource_type: type })

        return response
    } catch (error) {
        console.log("Error at Cloudinary delete: ", error)
        return null
    }
}

export {uploadOnCloudinary, deleteOnCloudinary}