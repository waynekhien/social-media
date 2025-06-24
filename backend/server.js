import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { v2 as cloudinary } from "cloudinary";

import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import postRouter from "./routes/post.routes.js";

import connectMongoDB from "./db/connectMongoDB.js";

dotenv.config();
cloudinary.config({
    cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
    api_key : process.env.CLOUDINARY_API_KEY,
    api_secret : process.env.CLOUDINARY_API_SECRET
});

const app = express();
const PORT = process.env.PORT || 5000;

console.log(process.env.MONGO_URI);

app.use(express.json());
app.use(express.urlencoded({extended : true}));

app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/posts", postRouter);



app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
    connectMongoDB();
});