const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const { createCanvas, loadImage } = require("canvas");
const multer = require("multer");

const uploadDir = process.env.UPLOAD_DIR || "tmp/uploads/";

const storage = multer.diskStorage({
  destination: uploadDir,
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

  const textLeftPosition = leftPosition - textWidth - 290;
  const textTopPosition = topPosition + ((resizedProductHeight / 2) + 17) ;  // Centered vertically

  // Drawing vertical line
  const lineLeftPosition = leftPosition - 80;  // 10 pixels to the left of the uploaded image
  const lineTopPosition = topPosition;
  const lineHeight = resizedProductHeight;

  // Drawing horizontal lines at the top and bottom of the vertical line
  const horizontalLineWidth = 40;

  ctx.strokeStyle = "white";
  ctx.lineWidth = 20;  // Width of the line
  ctx.beginPath();
  ctx.moveTo(lineLeftPosition, lineTopPosition);
  ctx.lineTo(lineLeftPosition, lineTopPosition + lineHeight);
  ctx.moveTo(lineLeftPosition - horizontalLineWidth / 2, lineTopPosition);
  ctx.lineTo(lineLeftPosition + horizontalLineWidth / 2, lineTopPosition);
  ctx.moveTo(lineLeftPosition - horizontalLineWidth / 2, lineTopPosition + lineHeight);
  ctx.lineTo(lineLeftPosition + horizontalLineWidth / 2, lineTopPosition + lineHeight);
  ctx.stroke();
  ctx.strokeStyle = "black";
  ctx.lineWidth = 7;  // Width of the line
  ctx.beginPath();
  ctx.moveTo(lineLeftPosition, lineTopPosition);
  ctx.lineTo(lineLeftPosition, lineTopPosition + lineHeight);
  ctx.moveTo(lineLeftPosition - horizontalLineWidth / 2, lineTopPosition);
  ctx.lineTo(lineLeftPosition + horizontalLineWidth / 2, lineTopPosition);
  ctx.moveTo(lineLeftPosition - horizontalLineWidth / 2, lineTopPosition + lineHeight);
  ctx.lineTo(lineLeftPosition + horizontalLineWidth / 2, lineTopPosition + lineHeight);
  ctx.stroke();

  // Drawing text
  ctx.fillStyle = "black";
  ctx.strokeStyle = "white";
  ctx.lineWidth = 18;
  ctx.font = 'Arial bold 70px sans-serif';
  ctx.strokeText(text, textLeftPosition, textTopPosition);
  ctx.fillText(text, textLeftPosition, textTopPosition);

  return canvas.toBuffer();
}

async function generateImage(req, res) {
  try {
    console.log('req.file:', req.file);
console.log('req.body:', req.body);
    if (!req.file || !req.file.filename) {
      console.error("An error occurred: Input file is missing");
      res.status(400).send("Input file is missing");
      return;
    }
    const uploadedImagePath = path.join(__dirname, "..",  "tmp/uploads", req.file.filename);
    const referenceImagePath = path.join(__dirname,  "..", "reference_images", `${req.body.referenceImage}.png`);

    console.log('Uploaded image path:', uploadedImagePath);
    console.log('Reference image path:', referenceImagePath);

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
}

module.exports = { generateImage, upload, drawTextOnImage };

