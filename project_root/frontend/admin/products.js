document.getElementById("productForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const product = {
        name: document.getElementById("name").value,
        image_url: document.getElementById("image_url").value,
        category: document.getElementById("category").value,
        price: parseFloat(document.getElementById("price").value)
    };

    console.log("Product prepared:", product);

    const msg = document.getElementById("product-message");
    msg.textContent = "Product is ready to send to backend!";
    msg.style.color = "var(--fm-green)";
});
