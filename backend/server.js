import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { v2 as cloudinary } from "cloudinary";

import authRouter from "./routes/auth.route.js";
import userRouter from "./routes/user.route.js";
import postRouter from "./routes/post.route.js";
import notificationRouter from "./routes/notification.route.js";
import messageRouter from "./routes/message.route.js";
import searchRouter from "./routes/search.route.js";

import connectMongoDB from "./db/connectMongoDB.js";
import { app, server } from "./lib/socket.js";

dotenv.config();
cloudinary.config({
    cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
    api_key : process.env.CLOUDINARY_API_KEY,
    api_secret : process.env.CLOUDINARY_API_SECRET
});

const PORT = process.env.PORT || 5000;

console.log(process.env.MONGO_URI);

app.use(express.json({limit : "5mb"}));
app.use(express.urlencoded({extended : true}));

app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/posts", postRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/messages", messageRouter);
app.use("/api/search", searchRouter);


server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
    connectMongoDB();
});