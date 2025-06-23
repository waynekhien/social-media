import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import authRouter from "./routes/auth.routes.js";
import connectMongoDB from "./db/connectMongoDB.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

console.log(process.env.MONGO_URI);

app.use(express.json());
app.use(express.urlencoded({extended : true}));

app.use(cookieParser());

app.use("/api/auth", authRouter);




app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
    connectMongoDB();
});