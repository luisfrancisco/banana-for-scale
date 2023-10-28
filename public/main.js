document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector("#productForm");
  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const formData = new FormData(form);
    const response = await fetch("/api/generate", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const blob = await response.blob();
      const img = document.createElement("img");
      img.src = URL.createObjectURL(blob);
      document.querySelector("#result").appendChild(img);
    } else {
      console.error("Failed to generate image.");
    }
  });
});
