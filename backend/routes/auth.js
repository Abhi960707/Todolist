const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Otp = require("../models/Otp");
const auth = require("../middleware/auth");
const otpGenerator = require("otp-generator");
const nodemailer = require("nodemailer");
const transporter = require("../config/mail");


const JWT_SECRET = process.env.JWT_SECRET || "secret";
const createToken = (userId) => jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "7d" });

const sanitizeUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
});

router.get("/test", (req, res) => {
    res.json("Auth Route Are Working");
});

router.post("/send-signup-otp", async (req, res) => {
    try {
        const email = req.body.email?.trim().toLowerCase();

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Already Account Exist" });
        }

        // Generate 6-digit OTP
        const otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });

        // Save or update in Otp collection
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
        await Otp.findOneAndUpdate(
            { email },
            { otp, expiresAt },
            { upsert: true, new: true }
        );

        // Send OTP via email
        await transporter.sendMail({
            from: process.env.EMAIL,
            to: email,
            subject: "Your Signup Verification OTP",
            html: `<h2>Welcome!</h2>
                   <p>Your verification OTP is <strong>${otp}</strong>.</p>
                   <p>It is valid for 10 minutes.</p>`,
        });

        res.json({ message: "OTP sent successfully to your email" });
    } catch (err) {
        console.error("Error sending signup OTP:", err);
        res.status(500).json({ message: "Unable to send OTP" });
    }
});

router.post("/signup", async (req, res) => {
    try {
        //console Check
        console.log(req.body); 
        
        const name = req.body.name?.trim();
        const email = req.body.email?.trim().toLowerCase();
        const password = req.body.password?.trim();
        const secretKeyword = req.body.secretKeyword?.trim();
        const otp = req.body.otp?.trim();

        if (!name || !email || !password || !secretKeyword || !otp) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (password.length < 4) {
            return res.status(400).json({ message: "Password must be at least 4 characters" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Already Account Exist" });
        }

        // Verify OTP
        const otpDoc = await Otp.findOne({ email });
        if (!otpDoc || otpDoc.otp !== otp) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        if (otpDoc.expiresAt < new Date()) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const hashedSecretKeyword = await bcrypt.hash(secretKeyword, 10);
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            secretKeyword: hashedSecretKeyword,
        });

        const savedUser = await newUser.save();

        // Delete OTP record upon successful registration
        await Otp.deleteOne({ email });

        res.status(201).json({
            token: createToken(savedUser._id),
            user: sanitizeUser(savedUser),
            message: "Signup successful",
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: "Already Account Exist" });
        }

        res.status(500).json({ message: "Unable to create account" });
    }
});

router.post("/login", async (req, res) => {
    try {
        const email = req.body.email?.trim().toLowerCase();
        const password = req.body.password?.trim();

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid password" });
        }

        res.json({
            token: createToken(user._id),
            user: sanitizeUser(user),
            message: "Login successful",
        });
    } catch (err) {
        res.status(500).json({ message: "Unable to login" });
    }
});

router.get("/me", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ user: sanitizeUser(user) });
    } catch (err) {
        res.status(500).json({ message: "Unable to fetch profile" });
    }
});

router.get("/users", auth, async (req, res) => {
    try {
        // Only return users that THIS logged-in user personally created
        const users = await User.find(
            { createdBy: req.user.id },
            "name email createdAt createdBy"
        ).sort({ createdAt: -1 });
        res.json({
            users: users.map((u) => ({
                ...sanitizeUser(u),
                createdBy: u.createdBy,
            }))
        });
    } catch (err) {
        res.status(500).json({ message: "Unable to fetch users" });
    }
});

router.post("/create-user", auth, async (req, res) => {
    try {
        const name = req.body.name?.trim();
        const email = req.body.email?.trim().toLowerCase();
        const password = req.body.password?.trim();
        const secretKeyword = req.body.secretKeyword?.trim();

        if (!name || !email || !password || !secretKeyword) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (password.length < 4) {
            return res.status(400).json({ message: "Password must be at least 4 characters" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "This email already exists so try another one" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const hashedSecretKeyword = await bcrypt.hash(secretKeyword, 10);
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            secretKeyword: hashedSecretKeyword,
            createdBy: req.user.id,   // track who created this user
        });
        const savedUser = await newUser.save();

        res.status(201).json({
            message: `User "${savedUser.name}" created successfully`,
            user: sanitizeUser(savedUser),
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: "An account with this email already exists" });
        }
        res.status(500).json({ message: "Unable to create user" });
    }
});

router.put("/change-password", auth, async (req, res) => {
    try {
        const currentPassword = req.body.currentPassword?.trim();
        const newPassword = req.body.newPassword?.trim();

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Both password fields are required" });
        }

        if (newPassword.length < 4) {
            return res.status(400).json({ message: "Password must be at least 4 characters" });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Current password is incorrect" });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({ message: "Password Changed Successfully !" });
    } catch (err) {
        res.status(500).json({ message: "Unable To Change PAssword" });
    }
});
router.get("/all-users", auth, async (req, res) => {
    try {
        const users = await User.find({}, "name email createdAt").sort({ name: 1 });
        res.json({ users: users.map(sanitizeUser) });
    } catch (err) {
        res.status(500).json({ message: "Unable to fetch all users" });
    }
});

router.get("/user/:id", auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .populate("createdBy", "name email")
            .select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            id: user._id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
            createdBy: user.createdBy,
        });
    } catch (err) {
        res.status(500).json({ message: "Unable to fetch user profile" });
    }
});

router.delete("/user/:id", auth, async (req, res) => {
    try {
        const userToDelete = await User.findById(req.params.id);

        if (!userToDelete) {
            return res.status(404).json({ message: "User not found" });
        }

        // Only the creator of this user account can delete it
        const creatorId = userToDelete.createdBy?.toString();
        if (creatorId !== req.user.id) {
            return res.status(403).json({ message: "You are not authorized to delete this user" });
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ message: `User "${userToDelete.name}" deleted successfully` });
    } catch (err) {
        res.status(500).json({ message: "Unable to delete user" });
    }
});

//Otp request process and password reseting
router.post("/request-password-reset", async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    user.resetOtp = otp;
    user.resetOtpExpiry = Date.now() + 10 * 60 * 1000;

    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL,
      to: user.email,
      subject: "Password Reset OTP",
      html: `<h2>Your OTP is ${otp}</h2>
             <p>Valid for 10 minutes</p>`,
    });

    res.json({
      message: "OTP sent to email",
    });
  } catch (err) {
  console.error("Forgot Password Error:", err);

  res.status(500).json({
    message: err.message,
  });
}
});

// Verify Otp process foir confirmatiom
router.post("/verify-reset-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.resetOtp !== otp) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    if (user.resetOtpExpiry < Date.now()) {
      return res.status(400).json({
        message: "OTP expired So Resend And Try again!",
      });
    }

    res.json({
      message: "OTP verified",
    });
  } catch (err) {
    res.status(500).json({
      message: "Verification failed",
    });
  }
});



router.post("/reset-password", async (req, res) => {
    try {
        const email = req.body.email?.trim().toLowerCase();
        const otp = req.body.otp?.trim();
        const secretKeyword = req.body.secretKeyword?.trim();
        const newPassword = req.body.newPassword?.trim();

        if (!email || !otp || !secretKeyword || !newPassword) {
            return res.status(400).json({ message: "Email, OTP, secret keyword and new password are required." });
        }

        if (newPassword.length < 4) {
            return res.status(400).json({ message: "Password must be at least 4 characters." });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        let isKeywordMatch = false;
        if (user.secretKeyword.startsWith('$2a$') || user.secretKeyword.startsWith('$2b$')) {
            isKeywordMatch = await bcrypt.compare(secretKeyword, user.secretKeyword);
        } else {
            isKeywordMatch = user.secretKeyword === secretKeyword;
        }

        if (!isKeywordMatch) {
            return res.status(400).json({ message: "Invalid secret keyword." });
        }

        if (user.resetOtp !== otp) {
            return res.status(400).json({ message: "Invalid OTP." });
        }

        if (!user.resetOtpExpiry || user.resetOtpExpiry < Date.now()) {
            return res.status(400).json({ message: "OTP has expired." });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.resetOtp = null;
        user.resetOtpExpiry = null;
        await user.save();

        res.status(200).json({ message: "Reset Password Successfully!" });
    } catch (err) {
        console.error("Reset password error:", err);
        res.status(500).json({ message: "Unable to reset password." });
    }
});

module.exports = router;
