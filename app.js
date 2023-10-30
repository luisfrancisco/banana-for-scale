const express = require("express");
const path = require("path");
const { generateImage, upload } = require("./api/generate");  // Import here

const app = express();
app.use(express.static("public"));

app.post("/generate", upload.single("productImage"), async (req, res) => {
  try {
    await generateImage(req, res);  // Use here
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
