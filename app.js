const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

const app = express();
app.use(express.static("public"));

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

app.post("/generate", upload.single("productImage"), async (req, res) => {
  try {
    const uploadedImagePath = path.join(__dirname, "uploads", req.file.filename);
    const referenceImagePath = path.join(__dirname, "reference_images", `${req.body.referenceImage}.png`);
    const outputImagePath = path.join(__dirname, "uploads", "output_" + req.file.filename);

    const referenceSizeCm = 90;
    const productSizeCm = parseFloat(req.body.productHeight);
    const scale = productSizeCm / referenceSizeCm;

    const uploadedImage = sharp(uploadedImagePath);
    const referenceImage = sharp(referenceImagePath);

    const resizedProductImageBuffer = await uploadedImage.resize({
      height: Math.round(2000 * scale)
    }).toBuffer();

    const resizedProductImageMetadata = await sharp(resizedProductImageBuffer).metadata();
    const resizedProductWidth = resizedProductImageMetadata.width;

    const referenceImageMetadata = await referenceImage.metadata();
    const refWidth = referenceImageMetadata.width;
    const refHeight = referenceImageMetadata.height;

    const leftPosition = Math.round((refWidth - resizedProductWidth) / 2);
    const topPosition = (refHeight- 250) - Math.round(2000 * scale);

    referenceImage.composite([{
      input: resizedProductImageBuffer,
      top: topPosition,
      left: leftPosition
    }]).toFile(outputImagePath, (err, info) => {
      if (err) {
        console.error("Composite error:", err);
        return res.status(500).send("Internal Server Error");
      }
      res.sendFile(outputImagePath, () => {
        fs.unlinkSync(uploadedImagePath);
        fs.unlinkSync(outputImagePath);
      });
    });
  } catch (error) {
    console.error("An internal error occurred:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
