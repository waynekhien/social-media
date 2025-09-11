import mongoose, { Schema } from "mongoose";

const postSchema = new mongoose.Schema({
    user : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true
    },
    text : {
        type : String
    },
    img : {
        type : String
    },
    likes : [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref : "User"
        }
    ],
    comments : [
        {
            text : {
                type : String,
                required : true
            },
            user : {
                type : mongoose.Schema.Types.ObjectId,
                ref : "User",
                required : true
            }
        }
    ],
    // Repost fields
    isRepost: {
        type: Boolean,
        default: false
    },
    originalPost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post"
    },
    repostComment: {
        type: String // Comment when reposting
    },
    reposts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ]

}, {timestamps : true});

const Post = mongoose.model("Post", postSchema);

export default Post;