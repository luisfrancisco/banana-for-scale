const { processImages, upload } = require('../imageProcessor');

module.exports = upload.single("productImage"), async (req, res) => {
  processImages(req, res);
};
