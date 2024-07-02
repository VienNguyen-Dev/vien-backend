import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (uploadFilePath) => {
  try {
    if (!uploadFilePath) return;
    //upload file on cloudinary

    const response = await cloudinary.uploader.upload(uploadFilePath, {
      resource_type: "auto"
    })

    console.log("File upload on the cloudinary", response.url);
    return response;
  } catch (error) {
    fs.unlinkSync(uploadFilePath);
  }
}

export { uploadOnCloudinary }