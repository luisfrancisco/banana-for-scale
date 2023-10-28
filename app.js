const express = require("express");
const { processImages, upload } = require('./imageProcessor');

const app = express();
app.use(express.static("public"));

app.post("/generate", upload.single("productImage"), async (req, res) => {
  processImages(req, res);
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
