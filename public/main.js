document.addEventListener("DOMContentLoaded", () => {
  const productImage = document.getElementById("productImage");
  const productHeight = document.getElementById("productHeight");
  const referenceImage = document.getElementById("referenceImage");
  const generateImage = document.getElementById("generateImage");
  const outputImage = document.getElementById("outputImage");
  const downloadButton = document.getElementById("downloadButton");

  generateImage.addEventListener("click", async () => {
    const formData = new FormData();
    formData.append("productImage", productImage.files[0]);
    formData.append("productHeight", productHeight.value);
    formData.append("referenceImage", referenceImage.value);

    try {
      const response = await fetch("/generate", {
        method: "POST",
        body: formData
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        outputImage.style.width = "500px";
        outputImage.style.height = "500px";
        outputImage.src = url;
        downloadButton.href = url;
        downloadButton.download = "scaled-product-image.png";
        downloadButton.style.display = "block";
      } else {
        alert("An error occurred. Please try again.");
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    }
  });
});
