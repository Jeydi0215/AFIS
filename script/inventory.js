document.querySelector(".openLess").addEventListener("click", function () {
  const vehiclesDiv = document.querySelector(".Vehicles");
  vehiclesDiv.style.display =
    vehiclesDiv.style.display === "flex" ? "none" : "flex";
});
document.querySelectorAll(".selects").forEach((button) => {
  button.addEventListener("click", () => {
    document
      .querySelector(".selects.Select_active")
      ?.classList.remove("Select_active");
    button.classList.add("Select_active");
  });
});
const buttons = document.querySelectorAll(".Selects button");
const contents = document.querySelectorAll(".content");

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    // Hide all content divs
    contents.forEach((content) => (content.style.display = "none"));

    // Get target ID and show that div
    const targetId = button.getAttribute("data-target");
    document.getElementById(targetId).style.display = "flex";
  });
});

// Store categories and initialize products
let categories = [];

// Fetch products from Google Sheets
function fetchProduct() {
  google.script.run.withSuccessHandler(displayData).getProducts();
}

// Open modal for creating a new category
function openCreateCategoryModal() {
  // Clear the input field
  document.getElementById("new-category").value = "";

  // Show the create category modal
  document.getElementById("create-category-modal").style.display = "block";
  document.getElementById("overlay").style.display = "block";
}

// Close modal for creating a new category
function closeCreateCategoryModal() {
  document.getElementById("create-category-modal").style.display = "none";
  document.getElementById("overlay").style.display = "none";
}

// Handle form submission for creating a new category
document
  .getElementById("create-category-form")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    const newCategory = document.getElementById("new-category").value;
    if (newCategory && !categories.includes(newCategory)) {
      categories.push(newCategory);
      updateCategoryDropdowns();
      closeCreateCategoryModal();

      // Alert user about success
      alert(`Category "${newCategory}" has been created successfully.`);
    } else if (categories.includes(newCategory)) {
      alert("This category already exists!");
    }
  });

// Display products in cards
function displayData(data) {
  if (!data) {
    console.error("No data received!");
    return;
  }

  var products = JSON.parse(data);
  sessionStorage.setItem("products", JSON.stringify(products)); // Store products in sessionStorage

  // Extract unique categories
  categories = [...new Set(products.map((product) => product["Category"]))];
  updateCategoryDropdowns();

  var container = document.getElementById("Approved");
  container.innerHTML = "";

  // Add "Add Item" card at the beginning
  var addItemCard = document.createElement("div");
  addItemCard.classList.add("card", "add-new-card");
  addItemCard.innerHTML = `
            <h3>Add New Item</h3>
            <p>Create a new product by clicking the button below</p>
            <button class="add-btn addb" onclick="openModal()">+ Add Item</button>
          `;
  container.appendChild(addItemCard);

  // Filter out products with qty === 0
  const filteredProducts = products.filter(
    (product) => Number(product["Qty"]) !== 0
  );

  // Display existing products
  filteredProducts.forEach((product, filteredIndex) => {
    var card = document.createElement("div");
    card.classList.add("card");

    // If media URL exists, add an image
    var mediaImg = product["Media Url"]
      ? `<img src="${product["Media Url"]}" alt="${product["Title"]}">`
      : `<img src="https://via.placeholder.com/150?text=No+Image" alt="No Image">`;

    // Find the original index of the product
    var originalIndex = products.findIndex(
      (p) => p["Item ID"] === product["Item ID"]
    );

    // Format the price with 2 decimal places
    const formattedPrice = parseFloat(product["Price"]).toFixed(2);

    card.innerHTML = `
              ${mediaImg}
              <div class="Card_inner">
                <span class="Stocks">In stock</span>
                <div class="Card_header">
                <h3 class="Card-title" >${product["Title"] ?? ""}</h3>

                  <div class="Discount">
                    <span class="price-badge">₱${formattedPrice}</span>
                    <del>₱999</del>
                  </div>
                </div>
                <p class="Card-desc">${product["Description"] ?? ""}</p>

                <button class="edit-btn" onclick="openEditModal(${originalIndex})"><div class="dot"></div> <div class="dot"></div> <div class="dot"></div></button>
                <span class="discount-btn">-60%</span>
              </div>
            `;
    container.appendChild(card);
  });
}

// Update category dropdowns
function updateCategoryDropdowns() {
  const categoryDropdowns = document.querySelectorAll(
    "select[id^='category'], select[id^='edit-category']"
  );
  categoryDropdowns.forEach((dropdown) => {
    dropdown.innerHTML =
      `<option value="">Select a category</option>` +
      categories
        .map((category) => `<option value="${category}">${category}</option>`)
        .join("");
  });

  const filterDropdown = document.getElementById("category-filter");
  if (filterDropdown) {
    filterDropdown.innerHTML =
      `<option value="">All Categories</option>` +
      categories
        .map((category) => `<option value="${category}">${category}</option>`)
        .join("");
  }
}

// Open modal for adding a new item
function openModal() {
  // Clear the form fields
  document.getElementById("add-item-form").reset();

  // Show the add item modal
  document.getElementById("add-item-modal").style.display = "block";
  document.getElementById("overlay").style.display = "block";
}

// Close modal for adding a new item
function closeModal() {
  document.getElementById("add-item-modal").style.display = "none";
  document.getElementById("overlay").style.display = "none";
}

// Handle form submission for adding a new item
document
  .getElementById("add-item-form")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    // Generate a unique ID
    const uniqueId = generateUniqueId();

    // Create new product object with "Item ID"
    var newProduct = {
      "Item ID": uniqueId, // Match your sheet's column name
      Title: document.getElementById("title").value,
      Description: document.getElementById("description").value,
      Category: document.getElementById("category").value,
      Price: document.getElementById("price").value,
      Qty: document.getElementById("qty").value,
      "Media Url": document.getElementById("media-url").value,
    };

    console.log("New product data:", newProduct);

    google.script.run
      .withSuccessHandler(function () {
        console.log("New item added successfully!");
        document.getElementById("add-item-form").reset();
        closeModal();
        fetchProduct();

        // Alert user about success
        alert(`Product "${newProduct.Title}" has been added successfully.`);
      })
      .withFailureHandler(function (error) {
        console.error("Failed to add new item:", error);
        alert("Failed to add new item: " + error);
      })
      .addNewProduct(newProduct);
  });

// Handle form submission for editing item
document
  .getElementById("edit-form")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    // Retrieve the ID from the form's dataset
    const id = document.getElementById("edit-form").dataset.id;
    console.log("Submitting edit for product with Item ID:", id);

    if (!id) {
      console.error("Product Item ID is undefined!");
      alert("Error: Product ID is missing. Cannot update.");
      return;
    }

    // Create the updated product object - include the Item ID in the update
    const updatedProduct = {
      "Item ID": id, // Include the Item ID in the update
      Title: document.getElementById("edit-title").value,
      Description: document.getElementById("edit-description").value,
      Category: document.getElementById("edit-category").value,
      Price: document.getElementById("edit-price").value,
      Qty: document.getElementById("edit-qty").value,
      "Media Url": document.getElementById("edit-media-url").value,
    };

    console.log("Updated product data:", updatedProduct);

    // Send the updated product to the server
    google.script.run
      .withSuccessHandler(function () {
        console.log("Product updated successfully!");
        document.getElementById("edit-form").reset();
        closeEditModal();
        fetchProduct(); // Refresh the product list

        // Alert user about success
        alert(
          `Product "${updatedProduct.Title}" has been updated successfully.`
        );
      })
      .withFailureHandler(function (error) {
        console.error("Failed to update product:", error);
        alert("Failed to update product: " + error);
      })
      .updateProduct(id, updatedProduct);
  });

// Open modal for editing item
function openEditModal(index) {
  var products = JSON.parse(sessionStorage.getItem("products"));

  if (!products || !products[index]) {
    console.error("Product data not found at index:", index);
    return;
  }

  var product = products[index];

  // Check if product has an Item ID, generate one if not
  if (!product["Item ID"]) {
    // Generate a new ID for this product
    product["Item ID"] = generateUniqueId();
    console.log(
      "Generated new Item ID for existing product:",
      product["Item ID"]
    );

    // Update the product in session storage with the new ID
    products[index] = product;
    sessionStorage.setItem("products", JSON.stringify(products));
  }

  var productId = product["Item ID"];

  // Populate the edit form
  document.getElementById("edit-title").value = product["Title"] || "";
  document.getElementById("edit-description").value =
    product["Description"] || "";
  document.getElementById("edit-category").value = product["Category"] || "";
  document.getElementById("edit-price").value = product["Price"] || "";
  document.getElementById("edit-qty").value = product["Qty"] || "";
  document.getElementById("edit-media-url").value = product["Media Url"] || "";

  // Store the ID in the form's dataset
  document.getElementById("edit-form").dataset.id = productId;
  console.log("Editing product with Item ID:", productId);

  document.getElementById("edit-item-modal").style.display = "block";
  document.getElementById("overlay").style.display = "block";
}

// Close modal for editing item
function closeEditModal() {
  console.log("Closing edit item modal");
  document.getElementById("edit-item-modal").style.display = "none";
  document.getElementById("overlay").style.display = "none";
}

// Generate a unique ID
function generateUniqueId() {
  return "ID-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
}

// Filter products by category
function filterByCategory() {
  const selectedCategory = document.getElementById("category-filter").value;
  const products = JSON.parse(sessionStorage.getItem("products"));

  const filteredProducts = selectedCategory
    ? products.filter((product) => product["Category"] === selectedCategory)
    : products;

  displayFilteredProducts(filteredProducts);
}

// Search products
function searchProducts() {
  const searchQuery = document
    .getElementById("search-input")
    .value.toLowerCase();
  const products = JSON.parse(sessionStorage.getItem("products"));

  const filteredProducts = products.filter((product) => {
    const title = product["Title"]?.toLowerCase() ?? "";
    const description = product["Description"]?.toLowerCase() ?? "";
    const category = product["Category"]?.toLowerCase() ?? "";

    return (
      title.includes(searchQuery) ||
      description.includes(searchQuery) ||
      category.includes(searchQuery)
    );
  });

  displayFilteredProducts(filteredProducts);
}

// Display filtered products
function displayFilteredProducts(filteredProducts) {
  const container = document.getElementById("Approved");
  container.innerHTML = "";

  // Add "Add Item" card at the beginning
  var addItemCard = document.createElement("div");
  addItemCard.classList.add("card", "add-new-card");
  addItemCard.innerHTML = `
            <h3>Add New Item</h3>
            <p>Create a new product by clicking the button below</p>
            <button class="add-btn" onclick="openModal()">+ Add Item</button>
          `;
  container.appendChild(addItemCard);

  // Filter out products with qty === 0
  const productsToDisplay = filteredProducts.filter(
    (product) => Number(product["Qty"]) !== 0
  );

  // Get all products to find original indices
  const allProducts = JSON.parse(sessionStorage.getItem("products"));

  // Display message if no products match the filter
  if (productsToDisplay.length === 0) {
    var noProductsMessage = document.createElement("div");
    noProductsMessage.classList.add("no-products-message");
    noProductsMessage.innerHTML = `
              <h3>No products found</h3>
              <p>Try changing your search criteria or adding new products.</p>
            `;
    noProductsMessage.style.gridColumn = "1 / -1";
    noProductsMessage.style.textAlign = "center";
    noProductsMessage.style.padding = "30px";
    container.appendChild(noProductsMessage);
    return;
  }

  productsToDisplay.forEach((product) => {
    var card = document.createElement("div");
    card.classList.add("card");

    // If media URL exists, add an image
    var mediaImg = product["Media Url"]
      ? `<img src="${product["Media Url"]}" alt="${product["Title"]}">`
      : `<img src="https://via.placeholder.com/150?text=No+Image" alt="No Image">`;

    // Find the original index of the product
    var originalIndex = allProducts.findIndex(
      (p) => p["Item ID"] === product["Item ID"]
    );

    // Format the price with 2 decimal places
    const formattedPrice = parseFloat(product["Price"]).toFixed(2);

    card.innerHTML = `
              <span class="qty-badge">Stock: ${product["Qty"] ?? ""}</span>
              ${mediaImg}
              <div class="Card_inner">
                <div class="Card_header">
                  <h3 class="Card-title" >${product["Title"] ?? ""}</h3>
                  <p class="Card-desc">${product["Description"] ?? ""}</p>


                </div>
              
                <div class="Blue">
                  <span class="price-badge">₱${formattedPrice}</span>


                </div>
              </div>
              <button class="edit-btn" onclick="openEditModal(${originalIndex})"><div class="dot"></div> <div class="dot"></div> <div class="dot"></div> </button>
            `;
    container.appendChild(card);
  });
}

// Call fetchProduct on page load
window.onload = function () {
  fetchProduct();
};
