const express = require("express");
const cors = require("cors");

const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");
const resultRoutes = require("./routes/resultRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", adminRoutes);
app.use("/api", userRoutes);
app.use("/api", resultRoutes);

app.listen(5000, () => {
  console.log("Server running on port 5000");
});