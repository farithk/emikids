const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const imageRoutes = require("./routes/imageRoutes");

const app = express();

// Middlewares
app.use(cors());
app.use(bodyParser.json()); // to parse JSON requests

// Use routes
app.use("/api/images", imageRoutes);

// Default route
app.get("/", (req, res) => {
    res.send("Welcome to the Image Generation API");
});

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
