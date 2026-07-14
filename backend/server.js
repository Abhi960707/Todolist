require("dotenv").config();
const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const transporter = require("./config/mail");//mail
const app = express();
//Check Email Sending
app.get('/send-mail', async (req, res) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL,
      to: 'thisis_test_email@gmail.com',
      subject: 'Test Email For Checking Send Or Not',
      html: '<h2>Hello Abhijeet  🚀</h2>',
    })

    res.json({ message: 'Email Sent Successfully' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Email Sending Failed' })
  }
})
console.log(process.env.EMAIL)
console.log(process.env.EMAIL_PASSWORD)


const PORT = process.env.PORT || 5000;
const MONGODB_URI =
    process.env.MONGODB_URI ||
    "mongodb+srv://abhi:abhi123@cluster0.jow73br.mongodb.net/tododb?retryWrites=true&w=majority&appName=Cluster0";
const ALLOWED_ORIGINS = [
        "http://localhost:8082",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    process.env.CLIENT_ORIGIN
].filter(Boolean);

app.use(
    cors({
        origin: function (origin, callback) {
            // allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);
            if (ALLOWED_ORIGINS.indexOf(origin) === -1) {
                var msg = 'The CORS policy for this site does not ' +
                    'allow access from the specified Origin.';
                return callback(new Error(msg), false);
            }
            return callback(null, true);
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

mongoose
    .connect(MONGODB_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log("MongoDB connection error:", err.message));

app.get("/", (req, res) => {
    res.send("Server running");
});


app.use("/api/auth", require("./routes/auth"));
app.use("/api/todo", require("./routes/todo"));
app.use("/api/todo/:todoId/subtasks", require("./routes/subtask"));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
 