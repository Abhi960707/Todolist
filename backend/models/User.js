const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
        },
        secretKeyword: {
            type: String,
            required: true,
            trim: true,
        },
        resetOtp:{
            type: String,
        default:null,       
     },
     resetOtpExpiry:{
        type:Date,
        default:null,
     },

        // Which logged-in user created this account.
        // null = self-registered via /signup
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
