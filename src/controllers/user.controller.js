import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResonse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from 'jsonwebtoken'


const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken }
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generate access and refresh token");
  }
}

const registerUser = asyncHandler(async (req, res) => {
  //1/ take value form frontend
  //2. Check validation
  //3. check user already exist
  //4. check avatar and coverImage 
  //5. create user Object
  //6. remove password and refreshToken when response
  //6. Create user success
  const { fullName, username, email, password } = req.body;
  if ([fullName, username, email, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All field are required")
  }

  const existUser = await User.findOne({
    $or: [{ username }, { email }]
  })

  if (existUser) {
    throw new ApiError(409, "User with username or email already exist")
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required")
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image file is required")
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new ApiError(400, "Avatar file is required")
  }


  const user = await User.create({
    fullName,
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    password,
    avatar: avatar.url,
    coverImage: coverImage.url || "",
  })

  const createdUser = await User.findById(user._id).select("-password -refreshToken");
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering new user")
  }
  return res.status(201).json(
    new ApiResonse(200, createdUser, "User registerd successfully")
  )
})

const loginUser = asyncHandler(async (req, res) => {
  //take data from frontend
  // check validation data
  //find user 
  //compare password
  //access and refreshToken
  const { username, email, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "Username or email is required")
  }

  const user = await User.findOne({
    $or: [{ username }, { email }]
  })

  if (!user) {
    throw new ApiError(404, "User not exist");
  }

  const isComparePassword = await user.isPasswordCorrect(password);

  if (!isComparePassword) {
    throw new ApiError(401, "Invalid credential user");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
  const options = {
    httpOnly: true,
    secure: true
  }
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
  return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResonse(
        200,
        {
          user: { loggedInUser, accessToken, refreshToken }
        },
        "User Login Successfully"
      )
    )
})

const logoutUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: undefined }
    },
    { new: true }
  )

  if (!user) {
    throw new ApiError(401, "Invalid credential user");
  }

  const options = {
    httpOnly: true,
    secure: true
  }
  return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
      new ApiResonse(
        200,
        {},
        "User log out successfully"
      )
    )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const inComingRefreshToken = req.cookies.refreshToken || req.body.refreshtoken;
    if (inComingRefreshToken) {
      throw new ApiError(400, "Unauthorized request");
    }
    const decodedToken = jwt.verify(
      inComingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token")
    }

    if (inComingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }
    const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id);

    const options = {
      httpOnly: true,
      secure: true

    }
    res.status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResonse(
          200,
          { accessToken, newRefreshToken },
          "Access refresh token"
        )
      )

  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
})


export { registerUser, loginUser, logoutUser }