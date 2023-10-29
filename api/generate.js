const { createCanvas, loadImage } = require('canvas');
const multer = require('multer');
const sharp = require('sharp');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

async function drawTextOnImage(imageBuffer, text, leftPosition, topPosition, resizedProductHeight) {
  const image = await loadImage(imageBuffer);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);

  const textWidth = ctx.measureText(text).width;

  const textLeftPosition = leftPosition - textWidth - 290;
  const textTopPosition = topPosition + ((resizedProductHeight / 2) + 17);

  const lineLeftPosition = leftPosition - 80;
  const lineTopPosition = topPosition;
  const lineHeight = resizedProductHeight;

  const horizontalLineWidth = 40;

  ctx.strokeStyle = "white";
  ctx.lineWidth = 20;
  ctx.beginPath();
  ctx.moveTo(lineLeftPosition, lineTopPosition);
  ctx.lineTo(lineLeftPosition, lineTopPosition + lineHeight);
  ctx.moveTo(lineLeftPosition - horizontalLineWidth / 2, lineTopPosition);
  ctx.lineTo(lineLeftPosition + horizontalLineWidth / 2, lineTopPosition);
  ctx.moveTo(lineLeftPosition - horizontalLineWidth / 2, lineTopPosition + lineHeight);
  ctx.lineTo(lineLeftPosition + horizontalLineWidth / 2, lineTopPosition + lineHeight);
  ctx.stroke();

  ctx.strokeStyle = "black";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(lineLeftPosition, lineTopPosition);
  ctx.lineTo(lineLeftPosition, lineTopPosition + lineHeight);
  ctx.moveTo(lineLeftPosition - horizontalLineWidth / 2, lineTopPosition);
  ctx.lineTo(lineLeftPosition + horizontalLineWidth / 2, lineTopPosition);
  ctx.moveTo(lineLeftPosition - horizontalLineWidth / 2, lineTopPosition + lineHeight);
  ctx.lineTo(lineLeftPosition + horizontalLineWidth / 2, lineTopPosition + lineHeight);
  ctx.stroke();

  ctx.fillStyle = "black";
  ctx.strokeStyle = "white";
  ctx.lineWidth = 18;
  ctx.font = 'Arial bold 70px sans-serif';
  ctx.strokeText(text, textLeftPosition, textTopPosition);
  ctx.fillText(text, textLeftPosition, textTopPosition);

  return canvas.toBuffer();
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const middleware = upload.single('productImage');

  middleware(req, res, async function(err) {
    if (err instanceof multer.MulterError) {
      return res.status(500).json(err);
    } else if (err) {
      return res.status(500).json(err);
    }

    try {
      const imageBuffer = req.file.buffer;
      const referenceImagePath = './reference_images';
      const referenceSizeCm = 90;
      const productSizeCm = parseFloat(req.body.productHeight);
      const scale = productSizeCm / referenceSizeCm;

      const uploadedImage = sharp(imageBuffer);
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

      res.setHeader('Content-Type', 'image/png');
      res.send(outputWithText);

    } catch (error) {
      console.error('An error occurred:', error);
      res.status(500).send('Internal Server Error');
    }
  });
};
