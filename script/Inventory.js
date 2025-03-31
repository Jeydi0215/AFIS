
  // Global variables
  let categories = [];
  let locations = [];
  let areas = [];
  let departments = [];
  let selectedProducts = [];
  let currentTab = "Pending"; // Default to Pending tab
  let suppliers = [];
  let poProducts = [];

  // Utility functions
  function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function showError(error) {
    console.error("Error:", error);
    const container = document.getElementById("product-container");
    if (container) {
      container.innerHTML = `
        <div class="empty-state error">
          <h3>Error Loading Data</h3>
          <p>${error.message || "Unknown error occurred"}</p>
        </div>
      `;
    }
    showToast("Failed to load products: " + (error.message || "Unknown error"), true);
  }

  function showToast(message, isError = false) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = `toast ${isError ? 'error' : ''}`;
    
    toast.innerHTML = `
      <svg class="toast-icon" viewBox="0 0 24 24">
        <path fill="currentColor" d="${isError ? 
          'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z' : 
          'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z'}"/>
      </svg>
      ${message}
    `;

    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 150);
    }, 2500);
  }

  function setDropdownValue(dropdownId, value, retries = 3, delay = 100) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;

    if (dropdown.options.length > 1 || retries === 0) {
      dropdown.value = value;
    } else {
      setTimeout(() => {
        setDropdownValue(dropdownId, value, retries - 1, delay);
      }, delay);
    }
  }

  // Tab functionality
  function initTabs() {
    const tabContainer = document.querySelector(".Selects");
    if (!tabContainer) return;
    
    const buttons = tabContainer.querySelectorAll("button");
    
    const initialTab = tabContainer.querySelector(`button[data-target="${currentTab}"]`);
    if (initialTab) {
      initialTab.classList.add("Select_active");
    } else if (buttons[0]) {
      buttons[0].classList.add("Select_active");
      currentTab = buttons[0].getAttribute("data-target");
    }
    
    buttons.forEach(button => {
      button.addEventListener("click", function() {
        buttons.forEach(btn => btn.classList.remove("Select_active"));
        this.classList.add("Select_active");
        currentTab = this.getAttribute("data-target");
        refreshDisplay();
      });
    });
  }

  function refreshDisplay() {
    try {
      const products = JSON.parse(sessionStorage.getItem("products")) || [];
      displayProductsByStatus(currentTab, products);
    } catch (e) {
      console.error("Error refreshing display:", e);
      showError(e);
    }
  }

  // Data functions
  function fetchProducts() {
    const container = document.getElementById("product-container");
    if (container) {
      container.innerHTML = `
        <div class="loading">
          <div class="spinner"></div>
          <p>Loading inventory...</p>
        </div>
      `;
    }

    google.script.run
      .withSuccessHandler(function(data) {
        try {
          const products = JSON.parse(data);
          sessionStorage.setItem("products", JSON.stringify(products));
          
          // Extract unique values for dropdowns
          categories = [...new Set(products.map(p => p.Category).filter(Boolean))].sort();
          locations = [...new Set(products.map(p => p.Location).filter(Boolean))].sort();
          areas = [...new Set(products.map(p => p.Area).filter(Boolean))].sort();
          departments = [...new Set(products.map(p => p.Department).filter(Boolean))].sort();
          
          // Update all dropdowns
          updateDropdowns("Category", categories);
          updateDropdowns("Location", locations);
          updateDropdowns("Area", areas);
          updateDropdowns("Department", departments);
          
          refreshDisplay();
          updateSummaryWidgets(products);
        } catch (e) {
          showError(new Error("Failed to parse product data"));
        }
      })
      .withFailureHandler(showError)
      .getProducts();
  }

  function displayProductsByStatus(status, productsToDisplay = null) {
    const container = document.getElementById("product-container");
    if (!container) return;

    container.innerHTML = "";
    
    let products = productsToDisplay || JSON.parse(sessionStorage.getItem("products")) || [];
    const filteredProducts = products.filter(product => product.Status === status);
    
    if (filteredProducts.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>No ${status} Products</h3>
          <p>There are currently no ${status.toLowerCase()} products in inventory.</p>
        </div>
      `;
    } else {
      filteredProducts.forEach(product => {
        const card = document.createElement("div");
        card.classList.add("card");
        card.innerHTML = status === "Pending" ? 
          createPendingCard(product) : 
          createStatusCard(product, status);
        container.appendChild(card);
      });
    }
  }

  function createStatusCard(product, status) {
    let statusClass = "in-stock";
    let statusText = "In Stock";
    
    if (status === "Rejected") {
      statusClass = "rejected";
      statusText = "Rejected";
    } else if (product["Qty"] <= 0) {
      statusClass = "out-of-stock";
      statusText = "Out of Stock";
    } else if (product["Qty"] < 5) {
      statusClass = "low-stock";
      statusText = "Low Stock";
    }

    const mediaImg = product["Media Url"]
      ? `<img src="${product["Media Url"]}" alt="${product["Title"]}">`
      : `<div class="no-image-placeholder">No Image</div>`;

    return `
      <input type="checkbox" class="delete-checkbox" data-product-id="${product["Item ID"]}">
      ${mediaImg}
      <div class="Card_inner">
        <span class="Stocks ${statusClass}">${statusText}</span>
        <div class="Card_header">
          <h3 class="Card-title">${product["Title"] || ""}</h3>
          <div class="Discount">
            <span class="price-badge">₱${parseFloat(product["Price"] || 0).toFixed(2)}</span>
          </div>
        </div>
        <p class="Card-desc">${product["Description"] || ""}</p>
        ${status === "Rejected" && product["RejectionReason"] 
          ? `<p class="rejection-reason"><strong>Reason:</strong> ${product["RejectionReason"]}</p>` 
          : ''}
        <button class="edit-btn" onclick="openEditModal('${product["Item ID"]}')">
          <div class="dot"></div> 
          <div class="dot"></div> 
          <div class="dot"></div>
        </button>
      </div>
    `;
  }

  function createPendingCard(product) {
    const mediaImg = product["Media Url"]
      ? `<img src="${product["Media Url"]}" alt="${product["Title"]}">`
      : `<div class="no-image-placeholder">No Image</div>`;

    return `
      <input type="checkbox" class="delete-checkbox" data-product-id="${product["Item ID"]}">
      ${mediaImg}
      <div class="Card_inner">
        <span class="Stocks pending">Pending</span>
        <div class="Card_header">
          <h3 class="Card-title">${product["Title"] || ""}</h3>
          <div class="Discount">
            <span class="price-badge">₱${parseFloat(product["Price"] || 0).toFixed(2)}</span>
          </div>
        </div>
        <p class="Card-desc">${product["Description"] || ""}</p>
        <div class="pending-actions">
          <button class="view-btn" onclick="viewProductDetails('${product["Item ID"]}')">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-eye">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
              <path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" />
            </svg>
          </button>
          <button class="approve-btn" onclick="showApprovalModal('${product["Item ID"]}')">
           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-circle-dashed-check"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8.56 3.69a9 9 0 0 0 -2.92 1.95" /><path d="M3.69 8.56a9 9 0 0 0 -.69 3.44" /><path d="M3.69 15.44a9 9 0 0 0 1.95 2.92" /><path d="M8.56 20.31a9 9 0 0 0 3.44 .69" /><path d="M15.44 20.31a9 9 0 0 0 2.92 -1.95" /><path d="M20.31 15.44a9 9 0 0 0 .69 -3.44" /><path d="M20.31 8.56a9 9 0 0 0 -1.95 -2.92" /><path d="M15.44 3.69a9 9 0 0 0 -3.44 -.69" />
           <path d="M9 12l2 2l4 -4" /></svg>
          </button>
          <button class="reject-btn" onclick="showRejectionModal('${product["Item ID"]}')">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-x">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M18 6l-12 12" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  // Modal functions
  function showModal(modalId) {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('overlay');
    
    if (!modal || !overlay) return;
    
    modal.style.top = '50%';
    modal.style.left = '50%';
    modal.style.transform = 'translate(-50%, -50%)';
    
    modal.style.display = 'block';
    modal.classList.add('active');
    overlay.style.display = 'block';
    
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
      modal.style.display = 'none';
      modal.classList.remove('active');
    });
    document.getElementById('overlay').style.display = 'none';
    document.body.style.overflow = '';
  }

  function viewProductDetails(productId) {
    const products = JSON.parse(sessionStorage.getItem("products")) || [];
    const product = products.find(p => p["Item ID"] === productId);
    
    if (!product) {
      showToast("Product not found", true);
      return;
    }

    const modalHTML = `
      <div id="product-details-modal" class="modal product-details-modal">
        <div class="modal-content">
          <button class="close-btn" onclick="closeModal()">&times;</button>
          <h3>${product["Title"] || "No Title"}</h3>
          ${product["Media Url"] ? 
            `<img src="${product["Media Url"]}" alt="${product["Title"]}" class="detail-image">` : 
            '<div class="no-image">No Image Available</div>'}
          <div class="product-info">
            <p><strong>Description:</strong> ${product["Description"] || "No description"}</p>
            <p><strong>Category:</strong> ${product["Category"] || "Uncategorized"}</p>
            <p><strong>Price:</strong> ₱${parseFloat(product["Price"] || 0).toFixed(2)}</p>
            <p><strong>Quantity:</strong> ${product["Qty"] || 0}</p>
            <p><strong>Status:</strong> ${product["Status"] || "Unknown"}</p>
            ${product["RejectionReason"] ? `<p><strong>Rejection Reason:</strong> ${product["RejectionReason"]}</p>` : ''}
          </div>
        </div>
      </div>
    `;
    
    const existingModal = document.getElementById('product-details-modal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    showModal('product-details-modal');
  }

  function showApprovalModal(productId) {
    const modalHTML = `
      <div id="approval-modal" class="modal">
        <div class="modal-content">
          <button class="close-btn" onclick="closeModal()">&times;</button>
          <h3>Confirm Approval</h3>
          <p>Are you sure you want to approve this product?</p>
          <div class="modal-actions">
            <button class="cancel-btn" onclick="closeModal()">Cancel</button>
            <button onclick="confirmApproval('${productId.replace(/'/g, "\\'")}')" class="confirm-approve">Approve</button>
          </div>
        </div>
      </div>
    `;
    
    const existingModal = document.getElementById('approval-modal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    showModal('approval-modal');
  }

  function confirmApproval(productId) {
    google.script.run
      .withSuccessHandler((result) => {
        if (result && result.success) {
          showToast("Product approved successfully!");
          updateProductStatus(productId, "Approved");
          closeModal();
          fetchProducts();
        } else {
          showToast(result.message || "Approval failed", true);
        }
      })
      .withFailureHandler(error => {
        showToast("Approval failed: " + error.message, true);
      })
      .updateProductStatus(productId, "Approved");
  }

  function showRejectionModal(productId) {
    const modalHTML = `
      <div id="rejection-modal" class="modal">
        <div class="modal-content">
          <button class="close-btn" onclick="closeModal()">&times;</button>
          <h3>Reject Product</h3>
          <p>Please provide a reason for rejecting this product:</p>
          <textarea id="rejection-reason" placeholder="Enter reason..." rows="4" required></textarea>
          <div class="modal-actions">
            <button class="cancel-btn" onclick="closeModal()">Cancel</button>
            <button onclick="rejectProduct('${productId.replace(/'/g, "\\'")}')" class="confirm-reject">Reject</button>
          </div>
        </div>
      </div>
    `;
    
    const existingModal = document.getElementById('rejection-modal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    showModal('rejection-modal');
  }

  function rejectProduct(productId) {
    const reason = document.getElementById("rejection-reason").value;
    if (!reason) {
      showToast("Please provide a reason for rejection", true);
      return;
    }

    google.script.run
      .withSuccessHandler((result) => {
        if (result && result.success) {
          showToast("Product rejected successfully!");
          updateProductStatus(productId, "Rejected", reason);
          closeModal();
          fetchProducts();
        } else {
          showToast(result.message || "Rejection failed", true);
        }
      })
      .withFailureHandler(error => {
        showToast("Rejection failed: " + error.message, true);
      })
      .updateProductStatus(productId, "Rejected", reason);
  }

  function updateProductStatus(productId, newStatus, rejectionReason = "") {
    const products = JSON.parse(sessionStorage.getItem("products")) || [];
    const productIndex = products.findIndex(p => p["Item ID"] === productId);
    
    if (productIndex !== -1) {
      products[productIndex].Status = newStatus;
      if (rejectionReason) {
        products[productIndex].RejectionReason = rejectionReason;
      }
      sessionStorage.setItem("products", JSON.stringify(products));
      refreshDisplay();
    }
  }

  function openCreateModal() {
    document.getElementById("add-item-form").reset();
    showModal("add-item-modal");
  }

  function openEditModal(productId) {
    const products = JSON.parse(sessionStorage.getItem("products")) || [];
    const product = products.find(p => p["Item ID"] === productId);

    if (!product) {
      showToast("Product not found", true);
      return;
    }

    document.getElementById("edit-form").dataset.productId = productId;
    document.getElementById("edit-title").value = product["Title"] || "";
    document.getElementById("edit-description").value = product["Description"] || "";
    document.getElementById("edit-cost").value = product["Cost"] || "0.00";
    document.getElementById("edit-price").value = product["Price"] || "0.00";
    document.getElementById("edit-qty").value = product["Qty"] || "0";
    document.getElementById("edit-media-url").value = product["Media Url"] || "";

    setDropdownValue("edit-category", product["Category"] || "");
    setDropdownValue("edit-location", product["Location"] || "");
    setDropdownValue("edit-area", product["Area"] || "");
    setDropdownValue("edit-department", product["Department"] || "");

    showModal("edit-item-modal");
  }

  function openCreateCategoryModal() {
    document.getElementById("create-category-form").reset();
    document.querySelector("#create-category-modal h3").textContent = "Create New Category";
    showModal("create-category-modal");
  }

  function openAddAreaModal(selectElement = null) {
    document.getElementById("create-category-form").reset();
    document.querySelector("#create-category-modal h3").textContent = "Add New Area";
    document.getElementById("create-category-modal").dataset.targetSelect = selectElement ? selectElement.id : '';
    showModal("create-category-modal");
  }

  function openAddLocationModal(selectElement = null) {
    document.getElementById("create-category-form").reset();
    document.querySelector("#create-category-modal h3").textContent = "Add New Location";
    document.getElementById("create-category-modal").dataset.targetSelect = selectElement ? selectElement.id : '';
    showModal("create-category-modal");
  }

  function openAddDepartmentModal(selectElement = null) {
    document.getElementById("create-category-form").reset();
    document.querySelector("#create-category-modal h3").textContent = "Add New Department";
    document.getElementById("create-category-modal").dataset.targetSelect = selectElement ? selectElement.id : '';
    showModal("create-category-modal");
  }

  function openSupplierModal() {
    document.getElementById("supplier-form").reset();
    showModal("supplier-modal");
  }

  function openPurchaseOrderModal() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('po-date').value = today;
    document.getElementById('po-date').min = today;
    
    loadSuppliers();
    loadPoProducts();
    
    showModal("purchase-order-modal");
  }

  function closeCreateCategoryModal() {
    closeModal();
  }

  // Purchase Order Functions
  function loadSuppliers() {
    google.script.run
      .withSuccessHandler(data => {
        try {
          suppliers = JSON.parse(data);
          const select = document.getElementById('po-supplier');
          select.innerHTML = '<option value="">Select a supplier</option>';
          
          suppliers.forEach(supplier => {
            const option = document.createElement('option');
            option.value = supplier['Supplier Name'];
            option.textContent = supplier['Supplier Name'];
            select.appendChild(option);
          });
        } catch (e) {
          console.error("Error loading suppliers:", e);
        }
      })
      .withFailureHandler(error => {
        console.error("Failed to load suppliers:", error);
      })
      .getSuppliers();
  }

  function loadPoProducts() {
    const products = JSON.parse(sessionStorage.getItem("products")) || [];
    poProducts = products.filter(p => p.Status === "Approved");
    updateProductDropdowns();
  }

  function updateProductDropdowns() {
    const dropdowns = document.querySelectorAll('.po-product');
    
    dropdowns.forEach(dropdown => {
      const currentValue = dropdown.value;
      dropdown.innerHTML = '<option value="">Select product</option>';
      
      poProducts.forEach(product => {
        const option = document.createElement('option');
        option.value = product['Item ID'];
        option.textContent = `${product['Title']} (${product['Category']})`;
        option.dataset.price = product['Price'];
        dropdown.appendChild(option);
      });
      
      if (currentValue) {
        dropdown.value = currentValue;
        updateProductPrice(dropdown);
      }
    });
  }

  function updateProductPrice(select) {
    const itemContainer = select.closest('.po-item');
    const priceDisplay = itemContainer.querySelector('.po-price');
    const selectedOption = select.options[select.selectedIndex];
    
    if (selectedOption && selectedOption.dataset.price) {
      priceDisplay.textContent = `₱${parseFloat(selectedOption.dataset.price).toFixed(2)}`;
    } else {
      priceDisplay.textContent = '₱0.00';
    }
    updatePoTotal();
  }

  function addPoItem() {
    const container = document.getElementById('po-items-container');
    const newItem = document.createElement('div');
    newItem.className = 'po-item';
    newItem.innerHTML = `
      <select class="po-product" onchange="updateProductPrice(this)">
        <option value="">Select product</option>
      </select>
      <input type="number" class="po-qty" placeholder="Qty" min="1" value="1" onchange="updatePoTotal()">
      <span class="po-price">₱0.00</span>
      <button type="button" class="small-btn danger" onclick="removePoItem(this)">Remove</button>
    `;
    container.appendChild(newItem);
    updateProductDropdowns();
  }

  function removePoItem(button) {
    const item = button.closest('.po-item');
    item.remove();
    updatePoTotal();
  }

  function updatePoTotal() {
    let totalQty = 0;
    
    document.querySelectorAll('.po-item').forEach(item => {
      const qtyInput = item.querySelector('.po-qty');
      totalQty += parseInt(qtyInput.value) || 0;
    });
    
    document.getElementById('po-total-qty').textContent = totalQty;
  }

  function saveSupplier(e) {
    e.preventDefault();
    
    const supplier = {
      name: document.getElementById('supplier-name').value,
      email: document.getElementById('supplier-email').value,
      address: document.getElementById('supplier-address').value,
      phone: document.getElementById('supplier-phone').value,
      contact_person: document.getElementById('contact-person').value,
      contact_phone: document.getElementById('contact-phone').value,
      bank_name: document.getElementById('bank-name').value,
      bank_type: document.getElementById('bank-type').value,
      account_name: document.getElementById('account-name').value,
      account_number: document.getElementById('account-number').value
    };
    
    google.script.run
      .withSuccessHandler(() => {
        showToast('Supplier saved successfully!');
        closeModal();
        loadSuppliers();
      })
      .withFailureHandler(error => {
        showToast('Failed to save supplier: ' + error.message, true);
      })
      .saveSupplier(supplier);
  }

  function submitPurchaseOrder(e) {
    e.preventDefault();
    
    const supplier = document.getElementById('po-supplier').value;
    const orderDate = document.getElementById('po-date').value;
    const notes = document.getElementById('po-notes').value;
    
    const items = [];
    document.querySelectorAll('.po-item').forEach(item => {
      const productSelect = item.querySelector('.po-product');
      const qtyInput = item.querySelector('.po-qty');
      
      if (productSelect.value && qtyInput.value) {
        const product = poProducts.find(p => p['Item ID'] === productSelect.value);
        if (product) {
          items.push({
            id: product['Item ID'],
            name: product['Title'],
            qty: parseInt(qtyInput.value),
            price: parseFloat(product['Price'])
          });
        }
      }
    });
    
    if (!supplier) {
      showToast('Please select a supplier', true);
      return;
    }
    
    if (items.length === 0) {
      showToast('Please add at least one item', true);
      return;
    }
    
    const poData = {
      supplier,
      orderDate,
      notes,
      items
    };
    
    google.script.run
      .withSuccessHandler(result => {
        showToast('Purchase order submitted successfully!');
        closeModal();
      })
      .withFailureHandler(error => {
        showToast('Failed to submit purchase order: ' + error.message, true);
      })
      .createPurchaseOrder(poData);
  }

  // Delete functionality
  function confirmDelete() {
    const selected = document.querySelectorAll('.delete-checkbox:checked');
    if (selected.length === 0) {
      showToast('Please select at least one product to delete', true);
      return;
    }
    
    showModal('confirmation-modal');
  }

  function processDeletion() {
    const selected = Array.from(document.querySelectorAll('.delete-checkbox:checked'))
      .map(checkbox => checkbox.dataset.productId);
      
    google.script.run
      .withSuccessHandler(() => {
        showToast(`${selected.length} product(s) deleted successfully`);
        closeModal();
        fetchProducts();
      })
      .withFailureHandler(error => {
        showToast('Failed to delete products: ' + error.message, true);
      })
      .deleteProducts(selected);
  }

  function toggleDeleteMode() {
    const container = document.getElementById('product-container');
    container.classList.toggle('delete-mode');
    
    const deleteBtn = document.getElementById('delete-selected-btn');
    deleteBtn.disabled = true;
    
    document.querySelectorAll('.delete-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', function() {
        const selected = document.querySelectorAll('.delete-checkbox:checked').length;
        deleteBtn.disabled = selected === 0;
      });
    });
  }

  // Search functionality
  function searchProducts() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const products = JSON.parse(sessionStorage.getItem("products")) || [];
    
    if (!searchTerm) {
      refreshDisplay();
      return;
    }
    
    const filtered = products.filter(product => 
      (product['Title'] && product['Title'].toLowerCase().includes(searchTerm)) ||
      (product['Description'] && product['Description'].toLowerCase().includes(searchTerm)) ||
      (product['Category'] && product['Category'].toLowerCase().includes(searchTerm))
    );
    
    displayProductsByStatus(currentTab, filtered);
  }

  // Filter functionality
  function filterProducts() {
    const category = document.getElementById('category-filter')?.value || '';
    const location = document.getElementById('location-filter')?.value || '';
    const area = document.getElementById('area-filter')?.value || '';
    const department = document.getElementById('department-filter')?.value || '';
    
    const products = JSON.parse(sessionStorage.getItem("products")) || [];
    
    const filtered = products.filter(product => {
      return (!category || product.Category === category) &&
             (!location || product.Location === location) &&
             (!area || product.Area === area) &&
             (!department || product.Department === department);
    });
    
    displayProductsByStatus(currentTab, filtered);
  }

  // Dropdown management functions
  function setupDropdownAddOptionsForElement(select) {
    if (select.id.includes('location') || select.id.includes('Location')) {
      if (!select.querySelector('option[value="add-location"]')) {
        const addOption = document.createElement('option');
        addOption.value = 'add-location';
        addOption.className = 'add-option';
        addOption.textContent = '+ Add New Location';
        select.appendChild(addOption);
      }
      select.addEventListener('change', function() {
        if (this.value === 'add-location') {
          openAddLocationModal(this);
        }
      });
    }
    
    if (select.id.includes('area') || select.id.includes('Area')) {
      if (!select.querySelector('option[value="add-area"]')) {
        const addOption = document.createElement('option');
        addOption.value = 'add-area';
        addOption.className = 'add-option';
        addOption.textContent = '+ Add New Area';
        select.appendChild(addOption);
      }
      select.addEventListener('change', function() {
        if (this.value === 'add-area') {
          openAddAreaModal(this);
        }
      });
    }
    
    if (select.id.includes('department') || select.id.includes('Department')) {
      if (!select.querySelector('option[value="add-department"]')) {
        const addOption = document.createElement('option');
        addOption.value = 'add-department';
        addOption.className = 'add-option';
        addOption.textContent = '+ Add New Department';
        select.appendChild(addOption);
      }
      select.addEventListener('change', function() {
        if (this.value === 'add-department') {
          openAddDepartmentModal(this);
        }
      });
    }
  }

  function setupDropdownAddOptions() {
    document.querySelectorAll('select').forEach(setupDropdownAddOptionsForElement);
  }

  function updateDropdowns(type, options) {
    const selectors = {
      "Category": 'select[id*="category"], select[id*="Category"]',
      "Location": 'select[id*="location"], select[id*="Location"]',
      "Area": 'select[id*="area"], select[id*="Area"]',
      "Department": 'select[id*="department"], select[id*="Department"]'
    };

    const selector = selectors[type];
    if (!selector) {
      console.warn(`Unknown dropdown type: ${type}`);
      return;
    }

    document.querySelectorAll(selector).forEach(select => {
      const currentValue = select.value;
      const optionsToKeep = Array.from(select.options)
        .filter(opt => opt.value.startsWith('add-') || opt.value === '')
        .map(opt => ({
          value: opt.value,
          text: opt.textContent,
          className: opt.className
        }));

      select.innerHTML = '';
      
      // Add preserved options (add-new options and empty first option)
      optionsToKeep.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.text;
        if (opt.className) option.className = opt.className;
        select.appendChild(option);
      });

      // Add new options
      options.forEach(optionValue => {
        if (!optionsToKeep.some(opt => opt.value === optionValue)) {
          const option = document.createElement('option');
          option.value = optionValue;
          option.textContent = optionValue;
          select.appendChild(option);
        }
      });

      // Restore previous selection if it still exists
      if (currentValue && Array.from(select.options).some(opt => opt.value === currentValue)) {
        select.value = currentValue;
      }

      // Re-setup event listeners for this dropdown
      setupDropdownAddOptionsForElement(select);
    });
  }

  function saveDropdownOptionToServer(type, value) {
    return new Promise((resolve, reject) => {
      if (!value || value.startsWith('add-')) {
        return reject(new Error("Invalid value"));
      }

      // Update local storage immediately
      switch(type) {
        case "Category":
          if (!categories.includes(value)) categories.push(value);
          sessionStorage.setItem("categories", JSON.stringify(categories));
          break;
        case "Location":
          if (!locations.includes(value)) locations.push(value);
          sessionStorage.setItem("locations", JSON.stringify(locations));
          break;
        case "Area":
          if (!areas.includes(value)) areas.push(value);
          sessionStorage.setItem("areas", JSON.stringify(areas));
          break;
        case "Department":
          if (!departments.includes(value)) departments.push(value);
          sessionStorage.setItem("departments", JSON.stringify(departments));
          break;
      }

      // Try to save to server (but don't fail if it doesn't work)
      const serverFunction = {
        "Category": "createCategory",
        "Location": "createLocation",
        "Area": "createArea",
        "Department": "createDepartment"
      }[type];

      if (!serverFunction) {
        console.warn(`No server function for ${type}`);
        return resolve(); // Still resolve to keep UI working
      }

      google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(error => {
          console.warn(`Server save failed for ${type}:`, error);
          resolve(); // Still resolve to prevent UI freeze
        })
        [serverFunction](value);
    });
  }

  // Form submission handlers
  function setupFormHandlers() {
    const editForm = document.getElementById("edit-form");
    if (editForm) {
      editForm.addEventListener("submit", function(e) {
        e.preventDefault();
        const productId = this.dataset.productId;
        const updatedProduct = {
          "Item ID": productId,
          "Title": document.getElementById("edit-title").value,
          "Description": document.getElementById("edit-description").value,
          "Category": document.getElementById("edit-category").value,
          "Location": document.getElementById("edit-location").value,
          "Area": document.getElementById("edit-area").value,
          "Department": document.getElementById("edit-department").value,
          "Cost": document.getElementById("edit-cost").value,
          "Price": document.getElementById("edit-price").value,
          "Qty": document.getElementById("edit-qty").value,
          "Media Url": document.getElementById("edit-media-url").value
        };

        google.script.run
          .withSuccessHandler(function() {
            showToast("Product updated successfully!");
            closeModal();
            fetchProducts();
          })
          .withFailureHandler(function(error) {
            showToast("Failed to update product: " + error.message, true);
          })
          .updateProduct(updatedProduct);
      });
    }

    const addItemForm = document.getElementById("add-item-form");
    if (addItemForm) {
      addItemForm.addEventListener("submit", function(event) {
        event.preventDefault();
        const uniqueId = generateUniqueId();
        const newProduct = {
          "Item ID": uniqueId,
          "Title": document.getElementById("title").value,
          "Description": document.getElementById("description").value,
          "Category": document.getElementById("category").value,
          "Location": document.getElementById("location").value,
          "Area": document.getElementById("area").value,
          "Department": document.getElementById("department").value,
          "Price": document.getElementById("price").value,
          "Qty": document.getElementById("qty").value,
          "Media Url": document.getElementById("media-url").value,
          "Status": "Pending"
        };

        google.script.run
          .withSuccessHandler(function() {
            addItemForm.reset();
            closeModal();
            fetchProducts();
            showToast(`Product "${newProduct.Title}" added successfully!`);
          })
          .withFailureHandler(function(error) {
            showToast("Failed to add product: " + error.message, true);
          })
          .addNewProduct(newProduct);
      });
    }

    const createCategoryForm = document.getElementById("create-category-form");
    if (createCategoryForm) {
      createCategoryForm.addEventListener("submit", async function(event) {
        event.preventDefault();
        const modal = document.getElementById("create-category-modal");
        const modalTitle = document.querySelector("#create-category-modal h3").textContent;
        const value = document.getElementById("new-category").value.trim();
        const targetSelectId = modal.dataset.targetSelect;
        
        if (!value) {
          showToast("Please enter a valid value", true);
          return;
        }

        let type, list;
        if (modalTitle.includes("Category")) {
          type = "Category";
          list = categories;
        } else if (modalTitle.includes("Area")) {
          type = "Area";
          list = areas;
        } else if (modalTitle.includes("Location")) {
          type = "Location";
          list = locations;
        } else if (modalTitle.includes("Department")) {
          type = "Department";
          list = departments;
        } else {
          showToast("Unknown creation type", true);
          return;
        }

        // Update local list immediately
        if (!list.includes(value)) {
          list.push(value);
          list.sort();
        }

        try {
          // Update UI first
          updateDropdowns(type, list);
          
          if (targetSelectId) {
            const targetSelect = document.getElementById(targetSelectId);
            if (targetSelect) {
              targetSelect.value = value;
            }
          }

          // Try to save to server (but don't block if it fails)
          await saveDropdownOptionToServer(type, value);
          showToast(`${type} "${value}" added successfully!`);
        } catch (error) {
          console.error("Error saving option:", error);
          // Still show success since we updated locally
          showToast(`${type} "${value}" added (local cache only)`, false);
        } finally {
          closeModal(); // Ensure modal always closes
          document.getElementById("new-category").value = ""; // Clear input
        }
      });
    }

    const supplierForm = document.getElementById("supplier-form");
    if (supplierForm) {
      supplierForm.addEventListener("submit", saveSupplier);
    }

    const poForm = document.getElementById("purchase-order-form");
    if (poForm) {
      poForm.addEventListener("submit", submitPurchaseOrder);
    }
  }

  function generateUniqueId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function updateSummaryWidgets(products) {
    try {
      const approvedProducts = products.filter(p => p.Status === "Approved");
      
      const totalProducts = approvedProducts.length;
      const totalProfit = approvedProducts.reduce((sum, product) => {
        return sum + ((parseFloat(product.Price) || 0) - (parseFloat(product.Cost) || 0)) * (parseInt(product.Qty) || 0);
      }, 0);
      const totalInventoryCost = approvedProducts.reduce((sum, product) => {
        return sum + (parseFloat(product.Cost) || 0) * (parseInt(product.Qty) || 0);
      }, 0);
      const avgCostPerItem = totalProducts > 0 ? (totalInventoryCost / totalProducts) : 0;

      document.getElementById("total-products").textContent = totalProducts;
      document.getElementById("total-profit").textContent = `₱${totalProfit.toFixed(2)}`;
      document.getElementById("total-cost-per-item").textContent = `₱${avgCostPerItem.toFixed(2)}`;
      document.getElementById("total-inventory-cost").textContent = `₱${totalInventoryCost.toFixed(2)}`;
    } catch (error) {
      console.error("Error updating summary widgets:", error);
    }
  }

  function loadLocalDropdownData() {
    google.script.run
      .withSuccessHandler(data => {
        const options = JSON.parse(data);
        categories = options.categories || [];
        locations = options.locations || [];
        areas = options.areas || [];
        departments = options.departments || [];

        sessionStorage.setItem("categories", JSON.stringify(categories));
        sessionStorage.setItem("locations", JSON.stringify(locations));
        sessionStorage.setItem("areas", JSON.stringify(areas));
        sessionStorage.setItem("departments", JSON.stringify(departments));

        // Update all dropdowns
        updateDropdowns("Category", categories);
        updateDropdowns("Location", locations);
        updateDropdowns("Area", areas);
        updateDropdowns("Department", departments);
      })
      .withFailureHandler(error => {
        console.error("Error loading dropdown data:", error);
        // Fallback to sessionStorage if available
        categories = JSON.parse(sessionStorage.getItem("categories")) || [];
        locations = JSON.parse(sessionStorage.getItem("locations")) || [];
        areas = JSON.parse(sessionStorage.getItem("areas")) || [];
        departments = JSON.parse(sessionStorage.getItem("departments")) || [];
      })
      .getDropdownOptions();
  }

  function initializeApp() {
    try {
      // First try to load from sessionStorage
      categories = JSON.parse(sessionStorage.getItem("categories")) || [];
      locations = JSON.parse(sessionStorage.getItem("locations")) || [];
      areas = JSON.parse(sessionStorage.getItem("areas")) || [];
      departments = JSON.parse(sessionStorage.getItem("departments")) || [];

      // Then try to load from server
      loadLocalDropdownData();
      
      initTabs();
      setupDropdownAddOptions();
      setupFormHandlers();
      
      // Set up event listeners for buttons
      document.getElementById('add-product-btn')?.addEventListener('click', openCreateModal);
      document.getElementById('add-supplier-btn')?.addEventListener('click', openSupplierModal);
      document.getElementById('create-po-btn')?.addEventListener('click', openPurchaseOrderModal);
      document.getElementById('search-input')?.addEventListener('input', searchProducts);
      document.getElementById('delete-selected-btn')?.addEventListener('click', confirmDelete);
      document.getElementById('toggle-delete-mode')?.addEventListener('click', toggleDeleteMode);
      document.getElementById('confirm-delete-btn')?.addEventListener('click', processDeletion);
      document.getElementById('cancel-delete-btn')?.addEventListener('click', closeModal);
      
      // Set up filter event listeners
      document.getElementById('category-filter')?.addEventListener('change', filterProducts);
      document.getElementById('location-filter')?.addEventListener('change', filterProducts);
      document.getElementById('area-filter')?.addEventListener('change', filterProducts);
      document.getElementById('department-filter')?.addEventListener('change', filterProducts);
      
      // Initial data load
      fetchProducts();
    } catch (error) {
      console.error("Initialization error:", error);
      showError(error);
    }
  }

  // Global functions
  window.fetchProducts = fetchProducts;
  window.openCreateModal = openCreateModal;
  window.closeModal = closeModal;
  window.viewProductDetails = viewProductDetails;
  window.showApprovalModal = showApprovalModal;
  window.confirmApproval = confirmApproval;
  window.showRejectionModal = showRejectionModal;
  window.rejectProduct = rejectProduct;
  window.openEditModal = openEditModal;
  window.openCreateCategoryModal = openCreateCategoryModal;
  window.openAddAreaModal = openAddAreaModal;
  window.openAddLocationModal = openAddLocationModal;
  window.openAddDepartmentModal = openAddDepartmentModal;
  window.openSupplierModal = openSupplierModal;
  window.openPurchaseOrderModal = openPurchaseOrderModal;
  window.updateProductPrice = updateProductPrice;
  window.addPoItem = addPoItem;
  window.removePoItem = removePoItem;
  window.updatePoTotal = updatePoTotal;
  window.searchProducts = searchProducts;
  window.filterProducts = filterProducts;
  window.confirmDelete = confirmDelete;
  window.processDeletion = processDeletion;
  window.closeCreateCategoryModal = closeCreateCategoryModal;
  window.toggleDeleteMode = toggleDeleteMode;

  // Start the application
  document.addEventListener('DOMContentLoaded', initializeApp);
