const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const { createCanvas, loadImage } = require("canvas");

const app = express();
app.use(express.static("public"));

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

async function drawTextOnImage(imageBuffer, text, leftPosition, topPosition, resizedProductHeight) {
  const image = await loadImage(imageBuffer);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);

  const textWidth = ctx.measureText(text).width;

  const textLeftPosition = leftPosition - textWidth - 240;
  const textTopPosition = topPosition + ((resizedProductHeight / 2) + 20) ;  // Centered vertically

  ctx.fillStyle = "black";
  ctx.strokeStyle = "white";
  ctx.lineWidth = 18;
  ctx.font = 'Arial bold 80px sans-serif';
  ctx.strokeText(text, textLeftPosition, textTopPosition);
  ctx.fillText(text, textLeftPosition, textTopPosition);

  return canvas.toBuffer();
}

app.post("/generate", upload.single("productImage"), async (req, res) => {
  try {
    const uploadedImagePath = path.join(__dirname, "uploads", req.file.filename);
    const referenceImagePath = path.join(__dirname, "reference_images", `${req.body.referenceImage}.png`);

    const referenceSizeCm = 90;
    const productSizeCm = parseFloat(req.body.productHeight);
    const scale = productSizeCm / referenceSizeCm;

    const uploadedImage = sharp(uploadedImagePath);
    const referenceImage = sharp(referenceImagePath);

    const resizedProductImageBuffer = await uploadedImage.resize({
      height: Math.round(2000 * scale)
    }).toBuffer();

    const referenceImageMetadata = await referenceImage.metadata();
    const refWidth = referenceImageMetadata.width;
    const refHeight = referenceImageMetadata.height;

    const resizedProductImageMetadata = await sharp(resizedProductImageBuffer).metadata();
    const resizedProductWidth = resizedProductImageMetadata.width;
    const resizedProductHeight = Math.round(2000 * scale);


    const leftPosition = Math.round((refWidth - resizedProductWidth) / 2);
    const topPosition = (refHeight - 250) - Math.round(2000 * scale);

    const outputBuffer = await referenceImage.composite([{
      input: resizedProductImageBuffer,
      top: topPosition,
      left: leftPosition
    }]).toBuffer();

    const outputWithText = await drawTextOnImage(outputBuffer, `${req.body.productHeight} cm`, leftPosition, topPosition, resizedProductHeight);


    res.setHeader("Content-Type", "image/png");
    res.send(outputWithText);

    fs.unlinkSync(uploadedImagePath);
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
