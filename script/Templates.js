
document.addEventListener("DOMContentLoaded", function () {
  document.body.addEventListener("click", function (event) {
      if (event.target.id === "backButton") {
          console.log("Back button clicked");

          // Hide the createTemplateContainer
          const createTemplateContainer = document.getElementById("createTemplateContainer");
          if (createTemplateContainer) {
              createTemplateContainer.style.display = "none";
          }

          // Show the folderDisplay using the stored previous state or default to "flex"
          const folderDisplay = document.getElementById("folderDisplay");
          if (folderDisplay) {
              folderDisplay.style.display = window.previousFolderDisplayState || "flex";
          }

          // Reset the folder title breadcrumb - remove everything after "Folders" and first arrow
          const folderTitle = document.querySelector(".Folder_title");
          if (folderTitle) {
              // Keep only the first two children ("Folders" text and first arrow icon)
              while (folderTitle.children.length > 2) {
                  folderTitle.removeChild(folderTitle.lastChild);
              }
              
              // If you want to completely reset to just "Folders" without any arrow:
              // folderTitle.innerHTML = '<span>Folders</span>';
          }

          // Clear any selected folder
          selectedFolder = null;

          // Clear the stored category if needed
          window.selectedCategory = null;

          // No need to reload folders if we're just toggling visibility
      }
  });
});

// Toggle modal visibility on click
document.querySelectorAll(".toggleButton").forEach(button => {
    button.addEventListener("click", function () {
        document.querySelector(".Folder_modal").classList.toggle("hidden");
    });
});

document.querySelectorAll(".editButton").forEach((button, index) => {
  button.addEventListener("click", () => {
      const input = document.querySelectorAll(".editableInput")[index]; // Get corresponding input
      input.removeAttribute("readonly");
      input.focus(); // Auto-focus when editing
  });
});

document.querySelectorAll(".editableInput").forEach((input, index) => {
  input.addEventListener("blur", () => {
      input.setAttribute("readonly", true); // Make it readonly again
      const savedText = document.getElementById("savedText");
      if (savedText) {
          savedText.textContent = "Saved Value: " + input.value; // Save value
      }
  });

  // Attach limitInputLength function dynamically
  input.addEventListener("input", function () {
      if (this.value.length > 4) {
          this.value = this.value.slice(0, 4);
      }
  });
});

document.addEventListener("DOMContentLoaded", function () {
  const folderBtn = document.getElementById("folderBtn");
  const categoryBtn = document.getElementById("categoryBtn");
  const folderSection = document.querySelector(".Folder_section");
  const categorySection = document.querySelector(".Category_section");
  const categoryModal = document.getElementById("categoryConfirmationModal");

  // Show Folder section by default
  folderSection.style.display = "flex";
  categorySection.style.display = "none";

  folderBtn.addEventListener("click", function () {
      folderSection.style.display = "flex";
      categorySection.style.display = "none";
      folderBtn.classList.add("Btn_active");
      categoryBtn.classList.remove("Btn_active");
  });

  // Modified category button click handler
  categoryBtn.addEventListener("click", function () {
      // Show confirmation modal instead of directly showing the category section
      categoryModal.classList.remove("hidden");
  });
});


//For deleting the folder toggle
document.getElementById("toggleDelete").addEventListener("click", function () {
  document.querySelector(".Delete_container").classList.toggle("visible");
});

document.getElementById("cancelDelete").addEventListener("click", function () {
  document.querySelector(".Delete_container").classList.remove("visible");
});

//For toggling between Monthly, Quarterly, and Annually
document.addEventListener("DOMContentLoaded", function () {
  const select = document.getElementById("billing-cycle");
  const allDivs = document.querySelectorAll(".Monthly, .Quarterly, .Annually");

  function updateVisibility() {
    const selectedValue = select.value; // Get selected value
    allDivs.forEach(div => {
      if (div.classList.contains(selectedValue)) {
        div.style.display = "flex"; // Show the selected div
        div.style.flexDirection = "row";
      } else {
        div.style.display = "none"; // Hide others
      }
    });
  }

  // Set default state to "Monthly"
  updateVisibility();

  // Listen for changes in the select box
  select.addEventListener("change", updateVisibility);
});

//--------------------------------------------------------------------
// Global variables to store selected category and spreadsheet link
let selectedCategory = "";
let selectedSpreadsheetLink = "";
let selectedFolder = null; // Add this at the top of your script file

document.addEventListener("DOMContentLoaded", function () {
  // Add event listener to the Submit button
  document.querySelector(".Submit").addEventListener("click", function () {
      createFolder();
  });
});


// Function to load dropdown options from the "Categories" spreadsheet
function loadDropdown() {
  google.script.run.withSuccessHandler(function (data) {
      // Get both dropdown elements
      let dropdown = document.getElementById("billing-cycle");
      let dropdown1 = document.getElementById("billing-cycle1");
      
      // Clear both dropdowns
      dropdown.innerHTML = "";
      dropdown1.innerHTML = "";

      if (data.length === 0) {
          dropdown.innerHTML = "<option>No Data Found</option>";
          dropdown1.innerHTML = "<option>No Data Found</option>";
          return;
      }

      let defaultOption = document.createElement("option");
      defaultOption.textContent = "Select Category";
      defaultOption.value = "";
      
      // Add default option to both dropdowns
      dropdown.appendChild(defaultOption.cloneNode(true));
      dropdown1.appendChild(defaultOption.cloneNode(true));

      data.forEach(function (item) {
          let option = document.createElement("option");
          option.textContent = item.name;
          option.value = item.name;
          option.setAttribute("data-link", item.link);
          
          // Add option to both dropdowns
          dropdown.appendChild(option.cloneNode(true));
          dropdown1.appendChild(option.cloneNode(true));
      });
  }).getDropdownData("Categories");
}

// Call loadDropdown on page load
window.onload = loadDropdown;



// Submit Category
function submitCategory() {
  const categoryName = document.getElementById("categoryName").value.trim();
  const spreadsheetLink = document.getElementById("spreadsheetLink").value.trim();

  if (!categoryName || !spreadsheetLink) {
      alert("Please fill in all fields!");
      return;
  }

  const urlPattern = /^(https:\/\/docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9-_]+)/;
  if (!urlPattern.test(spreadsheetLink)) {
      alert("Please enter a valid Google Sheets URL!");
      return;
  }

  google.script.run.withSuccessHandler(function (message) {
      if (message.startsWith("Error")) {
          alert(message);
      } else {
          alert(message);
          document.getElementById("categoryName").value = "";
          document.getElementById("spreadsheetLink").value = "";
          hideAddCategoryModal();
          loadDropdown(); // Reload dropdown after adding a new category
      }
  }).addCategory(categoryName, spreadsheetLink);
}

// Add event listener to the Submit span
const submitButton = document.querySelector(".Submit");
if (submitButton) {
  submitButton.addEventListener("click", submitCategory);
} else {
  console.error("Submit button not found!");
}

// Listen for dropdown selection change
document.getElementById("billing-cycle").addEventListener("change", function () {
  let selectedOption = this.options[this.selectedIndex];

  if (selectedOption.value) {
      selectedCategory = selectedOption.textContent; // Get category name
      selectedSpreadsheetLink = selectedOption.getAttribute("data-link") || ""; // Get spreadsheet link

      console.log("Selected Category:", selectedCategory);
      console.log("Spreadsheet Link:", selectedSpreadsheetLink);

      // Update folderBtn with the selected category and link
      const folderBtn = document.getElementById("folderBtn");
      folderBtn.setAttribute("data-category", selectedCategory);
      folderBtn.setAttribute("data-link", selectedSpreadsheetLink);

      // Fetch and display folders for the selected category
      fetchAndDisplayFolders(selectedCategory);
  } else {
      // Reset when "Select Category" is chosen
      selectedCategory = "";
      selectedSpreadsheetLink = "";
      console.log("No category selected.");
  }
});

// Open Create Folder Modal & Pass Data
document.getElementById("folderBtn").addEventListener("click", function() {
  let createFolderModal = document.getElementById("createFolderModal");
  createFolderModal.setAttribute("data-category", selectedCategory);
  createFolderModal.setAttribute("data-link", selectedSpreadsheetLink);
  createFolderModal.style.display = "block"; // Show modal
});

// Handle Folder Creation
function createFolder() {
  // Get the year from the input field (note: using yearInput instead of folderName)
  let year = document.getElementById("yearInput").value.trim();
  
  // Get the selected category from the dropdown
  let categoryDropdown = document.getElementById("billing-cycle1");
  let selectedCategory = categoryDropdown.value;
  let selectedOption = categoryDropdown.options[categoryDropdown.selectedIndex];
  let selectedSpreadsheetLink = selectedOption.getAttribute("data-link");

  // Validate inputs
  if (!year || year.length !== 4 || isNaN(year)) {
      alert("Please enter a valid 4-digit year");
      return;
  }
  if (!selectedCategory || selectedCategory === "Select Category") {
      alert("Please select a category first");
      return;
  }
  if (!selectedSpreadsheetLink) {
      alert("Selected category doesn't have a valid spreadsheet link");
      return;
  }

  console.log(`Creating folder for year ${year} in category ${selectedCategory}`);

  // Call Google Apps Script to create the folder
  google.script.run
      .withSuccessHandler(function(folderId) {
          if (folderId.startsWith("Error")) {
              alert(folderId);
              return;
          }
          
          alert(`Successfully created folder for ${year}!`);
          document.getElementById("yearInput").value = "";
          document.querySelector(".Folder_modal").classList.add("hidden");
          
          // Refresh the folder list
          fetchAndDisplayFolders(selectedCategory);
      })
      .withFailureHandler(function(error) {
          alert("Error creating folder: " + error.message);
          console.error("Error:", error);
      })
      .createFolder(year, selectedCategory, selectedSpreadsheetLink);
      console.log("Created Folder ID:", folderId);
}

// Add event listener to the Submit button
document.getElementById("submitFolder").addEventListener("click", createFolder);


function fetchAndDisplayFolders(categoryName) {
  const profileName = document.querySelector(".profile-name").textContent.trim();
  const folderDisplay = document.getElementById("folderDisplay");

  // Show loading message
  folderDisplay.innerHTML = "<p>Loading folders...</p>";

  // Fetch folders from Google Apps Script
  google.script.run.withSuccessHandler(function (folders) {
      displayFolders(folders, categoryName);
  }).getUserFolders(profileName, categoryName);
}

function displayFolders(folders, selectedCategory) {
window.storedFolders = folders; // Store folders globally
window.selectedCategory = selectedCategory; // Store category globally

  const folderDisplay = document.getElementById("folderDisplay");
  folderDisplay.innerHTML = ""; // Clear previous folders

  if (folders.length === 0) {
      folderDisplay.innerHTML = `<p>No folders found for ${selectedCategory}.</p>`;
      return;
  }

  // Filter folders by selected category
  const filteredFolders = folders.filter(folder => folder.category === selectedCategory);

  // Sort folders alphabetically by name
  filteredFolders.sort((a, b) => a.name.localeCompare(b.name));

  // Display sorted folders
  filteredFolders.forEach(folder => {
      // Create folder element
      const folderDiv = document.createElement("div");
      folderDiv.className = "Folder";

      const folderInner = document.createElement("div");
      folderInner.className = "Folder_inner";

      // Add folder icon
      const folderIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      folderIcon.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      folderIcon.setAttribute("width", "24");
      folderIcon.setAttribute("height", "24");
      folderIcon.setAttribute("viewBox", "0 0 24 24");
      folderIcon.setAttribute("fill", "none");
      folderIcon.setAttribute("stroke", "currentColor");
      folderIcon.setAttribute("stroke-width", "1");
      folderIcon.setAttribute("stroke-linecap", "round");
      folderIcon.setAttribute("stroke-linejoin", "round");
      folderIcon.classList.add("icon", "icon-tabler", "icons-tabler-outline", "icon-tabler-folders");

      const path1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path1.setAttribute("stroke", "none");
      path1.setAttribute("d", "M0 0h24v24H0z");
      path1.setAttribute("fill", "none");

      const path2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path2.setAttribute("d", "M9 3h3l2 2h5a2 2 0 0 1 2 2v7a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-9a2 2 0 0 1 2 -2");

      const path3 = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path3.setAttribute("d", "M17 16v2a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-9a2 2 0 0 1 2 -2h2");

      folderIcon.appendChild(path1);
      folderIcon.appendChild(path2);
      folderIcon.appendChild(path3);

      // Add folder name
      const folderNameInput = document.createElement("input");
      folderNameInput.className = "yearInputFolder editableInput";
      folderNameInput.value = folder.name;
      folderNameInput.readOnly = true;

      // Add dropdown for actions
      const details = document.createElement("details");

      const summary = document.createElement("summary");
      const dotsIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      dotsIcon.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      dotsIcon.setAttribute("width", "24");
      dotsIcon.setAttribute("height", "24");
      dotsIcon.setAttribute("viewBox", "0 0 24 24");
      dotsIcon.setAttribute("fill", "none");
      dotsIcon.setAttribute("stroke", "currentColor");
      dotsIcon.setAttribute("stroke-width", "2");
      dotsIcon.setAttribute("stroke-linecap", "round");
      dotsIcon.setAttribute("stroke-linejoin", "round");
      dotsIcon.classList.add("icon", "icon-tabler", "icons-tabler-outline", "icon-tabler-dots-vertical");

      const dotsPath1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
      dotsPath1.setAttribute("stroke", "none");
      dotsPath1.setAttribute("d", "M0 0h24v24H0z");
      dotsPath1.setAttribute("fill", "none");

      const dotsPath2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
      dotsPath2.setAttribute("d", "M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0");

      const dotsPath3 = document.createElementNS("http://www.w3.org/2000/svg", "path");
      dotsPath3.setAttribute("d", "M12 19m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0");

      const dotsPath4 = document.createElementNS("http://www.w3.org/2000/svg", "path");
      dotsPath4.setAttribute("d", "M12 5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0");

      dotsIcon.appendChild(dotsPath1);
      dotsIcon.appendChild(dotsPath2);
      dotsIcon.appendChild(dotsPath3);
      dotsIcon.appendChild(dotsPath4);
      summary.appendChild(dotsIcon);

      const menuList = document.createElement("ul");
      const deleteItem = document.createElement("li");
      const deleteButton = document.createElement("button");
      deleteButton.id = "toggleDelete";
      deleteButton.className = "Delete";
      deleteButton.textContent = "Delete";
      deleteItem.appendChild(deleteButton);

      const renameItem = document.createElement("li");
      const renameButton = document.createElement("button");
      renameButton.className = "editButton Rename";
      renameButton.textContent = "Rename";
      renameItem.appendChild(renameButton);

      menuList.appendChild(deleteItem);
      menuList.appendChild(renameItem);
      details.appendChild(summary);
      details.appendChild(menuList);

      // Build folder structure
      folderInner.appendChild(folderIcon);
      folderInner.appendChild(folderNameInput);
      folderInner.appendChild(details);
      folderDiv.appendChild(folderInner);

      // Add click event to the folder
      deleteButton.addEventListener("click", function (e) {
          e.stopPropagation();
          showDeleteConfirmation(folder);
      });

      renameButton.addEventListener("click", function (e) {
          e.stopPropagation(); // Prevent triggering the folder click event
          renameFolder(folder, folderNameInput);
      });

      folderDiv.addEventListener("click", function (e) {
  // Don't interfere with other interactive elements
  if (e.target.closest("details") || e.target.closest("input")) {
      return;
  }

  // Update the folder title breadcrumb in the UI
  const folderTitle = document.querySelector(".Folder_title");
  if (folderTitle) {
      // Clear any existing spans beyond the first two (the "Folders" text and arrow icon)
      while (folderTitle.children.length > 2) {
          folderTitle.removeChild(folderTitle.lastChild);
      }
      
      // Add the selected category if it exists
      if (window.selectedCategory) {
          const categorySpan = document.createElement("span");
          categorySpan.textContent = window.selectedCategory;
          folderTitle.appendChild(createArrowIcon());
          folderTitle.appendChild(categorySpan);
      }
      
      // Add the current folder name
      folderTitle.appendChild(createArrowIcon());
      const folderNameSpan = document.createElement("span");
      folderNameSpan.textContent = folder.name;
      folderTitle.appendChild(folderNameSpan);
  }

  // Store current display state before changing it
  const folderDisplay = document.getElementById("folderDisplay");
  window.previousFolderDisplayState = window.getComputedStyle(folderDisplay).display;

  // Hide the folderDisplay
  if (folderDisplay) {
      folderDisplay.style.display = "none";
  }

  // Show the createTemplateContainer
  const createTemplateContainer = document.getElementById("createTemplateContainer");
  if (createTemplateContainer) {
      createTemplateContainer.style.display = "block";
  }

  // Rest of your existing code...
  selectedFolder = folder;
  
  // Show loading state
  const fileList = document.getElementById("fileList");
  if (fileList) {
      fileList.innerHTML = "<p>Loading files...</p>";
  }

  // Fetch and display files
  google.script.run
      .withSuccessHandler(displayFiles)
      .withFailureHandler(function (error) {
          if (fileList) {
              fileList.innerHTML = "<p>Error loading files</p>";
          }
          console.error("Error loading files:", error);
      })
      .getFilesInFolder(folder.id);
});

      // Add this to your folderDiv creation:
      folderDiv.setAttribute("data-id", folder.id);
      folderDisplay.appendChild(folderDiv);
  });
}

// Helper function to create the arrow icon
function createArrowIcon() {
  const arrowIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  arrowIcon.className = "Next";
  arrowIcon.setAttribute("fill", "#1f5497");
  arrowIcon.setAttribute("height", "12.5px");
  arrowIcon.setAttribute("width", "12.5px");
  arrowIcon.setAttribute("viewBox", "0 0 24 24");
  arrowIcon.innerHTML = `<g id="next"><g><polygon points="6.8,23.7 5.4,22.3 15.7,12 5.4,1.7 6.8,0.3 18.5,12"></polygon></g></g>`;
  return arrowIcon;
}

// Call when the page loads
document.addEventListener("DOMContentLoaded", function() {
  fetchAndDisplayFolders(""); // Initially load all folders
});

// Show the template creation modal when createTemplateContainer is clicked
document.getElementById("createTemplateBtn").addEventListener("click", function () {
  document.getElementById("templateModal").style.display = "block";
});

// Close the modal when the close button is clicked
document.getElementById("closeModal2").addEventListener("click", function () {
  document.getElementById("templateModal").style.display = "none";
});

// Handle template creation logic when the create button is clicked
document.getElementById("confirmTemplateCreation").addEventListener("click", function () {
  const templateName = document.getElementById("templateNameInput").value.trim();

  if (templateName === "") {
      alert("Please enter a valid template name.");
      return;
  }

  // Call the function to create the template
  createTemplate(templateName);

  // Close the modal after creation
  document.getElementById("templateModal").style.display = "none";
});
// Add this to your existing JavaScript
document.addEventListener("DOMContentLoaded", function() {
// Get elements
const categoryBtn = document.getElementById("categoryBtn");
const folderSection = document.querySelector(".Folder_section");
const categorySection = document.querySelector(".Category_section");
const categoryModal = document.getElementById("categoryConfirmationModal");
const closeModalBtn = categoryModal.querySelector(".close-modal");
const cancelBtn = document.getElementById("cancelCategoryCreation");
const confirmBtn = document.getElementById("confirmCategoryCreation");

// Show confirmation modal when category button is clicked
categoryBtn.addEventListener("click", function() {
  // Show the confirmation modal
  categoryModal.classList.remove("hidden");
});

// Close modal when X is clicked
closeModalBtn.addEventListener("click", function() {
  categoryModal.classList.add("hidden");
});

// Close modal when cancel is clicked
cancelBtn.addEventListener("click", function() {
  categoryModal.classList.add("hidden");
});

// Proceed with category creation when confirmed
confirmBtn.addEventListener("click", function() {
  // Hide the confirmation modal
  categoryModal.classList.add("hidden");
  
  // Show the category section (your existing functionality)
  folderSection.style.display = "none";
  categorySection.style.display = "flex";
  document.getElementById("folderBtn").classList.remove("Btn_active");
  categoryBtn.classList.add("Btn_active");
});

// Close modal when clicking outside the modal content
categoryModal.addEventListener("click", function(e) {
  if (e.target === categoryModal) {
    categoryModal.classList.add("hidden");
  }
});
});

function createTemplate(templateName) {
  if (!selectedFolder) {
      alert("Please select a folder first.");
      return;
  }

  // Use the global spreadsheet link if selectedFolder.spreadsheetURL is missing
  const spreadsheetURL = selectedFolder.spreadsheetURL || selectedSpreadsheetLink;

  if (!spreadsheetURL) {
      alert("No spreadsheet template found. Please check the category selection.");
      return;
  }

  const createButton = document.getElementById("confirmTemplateCreation");
  createButton.disabled = true; // Disable button to prevent multiple clicks

  google.script.run.withSuccessHandler(function(message) {
      alert(message);
      
      // Reset the modal UI
      resetTemplateModal();
      
      if (!message.includes("Error:")) {
          // Fetch and display the updated list of files in the folder
          fetchAndDisplayFiles(selectedFolder.id);
      }
  }).withFailureHandler(function(error) {
      alert("Error: " + error.message);
      createButton.disabled = false; // Re-enable button on failure
  }).createTemplateInFolder(selectedFolder.id, templateName, spreadsheetURL);
}

function resetTemplateModal() {
  // Clear the input field
  document.getElementById("templateNameInput").value = "";
  
  // Re-enable the create button
  document.getElementById("confirmTemplateCreation").disabled = false;
  
  // Hide the modal
  hideCreateTemplateModal();
}

function hideCreateTemplateModal() {
  document.getElementById("templateModal").style.display = "none";
}

function displayFiles(files) {
  const fileListContainer = document.getElementById("fileList");

  if (!fileListContainer) {
      console.error("Error: 'fileList' element not found in the DOM.");
      return;
  }

  fileListContainer.innerHTML = ""; // Clear previous files

  if (files.length === 0) {
      fileListContainer.innerHTML = `<p>No documents found in this folder.</p>`;
      return;
  }

  const filesGrid = document.createElement("div");
  filesGrid.className = "files-grid";

  files.forEach(file => {
      const fileCard = document.createElement("div");
      fileCard.className = "file-card";

      const fileName = document.createElement("h4");
      fileName.className = "file-name";
      fileName.textContent = file.name;
      fileName.title = file.name;

      const fileLink = document.createElement("a");
      fileLink.href = file.url;
      fileLink.target = "_blank";
      fileLink.className = "file-link";
      fileLink.setAttribute("aria-label", `Open ${file.name}`);

      // Open file and extract data when clicked
      fileLink.addEventListener("click", async (event) => {
          event.preventDefault(); // Prevent default link behavior
          console.log(`Opening file: ${file.name} from category: ${selectedCategory}`);

          // Get folderName from file data
          const folderName = file.folderName || "Unknown Folder"; 
          console.log(`File belongs to folder: ${folderName}`);

          // For Monthly Sales Report, do special processing
          if (selectedCategory === "Monthly Sales Report") {
              try {
                  // Extract all totals, including discount totals
                  const extractedTotals = await extractDatesFromFile(file.id);
                  const jobOrdersDiscountData = await getJobOrdersDiscountData();

                  if (!extractedTotals || Object.keys(extractedTotals).length === 0) {
                      console.warn(`No sumTotals found for ${file.name}`);
                      window.open(file.url, "_blank");
                      return;
                  }

                  console.log(`Extracted Totals from ${file.name}:`, extractedTotals);
                  console.log(`Extracted Discounts from ${file.name}:`, jobOrdersDiscountData);

                  // Merge discount data into extractedTotals before pasting
                  for (const date in extractedTotals) {
                      if (jobOrdersDiscountData[date]) {
                          extractedTotals[date].discount = jobOrdersDiscountData[date] || 0;
                      }
                  }

                  console.log(`Final Data to Paste for ${file.name}:`, extractedTotals);

                  // ✅ Pass folderName when fixing weeks & days
                  google.script.run.correctWeeklyDates(file.id, folderName);
                  google.script.run.pasteSumTotalToSheet(file.id, extractedTotals);
              } catch (error) {
                  console.error(`Error processing ${file.name}:`, error);
              }
          }
          
          // For all categories (including after special processing), open the file
          window.open(file.url, "_blank");
      });

      fileCard.appendChild(fileName);
      fileLink.appendChild(fileCard);
      filesGrid.appendChild(fileLink);
  });

  fileListContainer.appendChild(filesGrid);
}


// Helper function to format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
  }).format(amount);
}

// Function to call the server-side function to get sales data
async function getSalesDataFromFile(fileId) {
  return new Promise((resolve, reject) => {
      google.script.run
          .withSuccessHandler(resolve)
          .withFailureHandler(reject)
          .extractSalesData(fileId);
  });
}


// Function to call the server-side function for cash disbursements
async function getCashDisbursementData() {
  return new Promise((resolve, reject) => {
      google.script.run
          .withSuccessHandler(resolve)
          .withFailureHandler(reject)
          .getCashDisbursementTotalsByDate();
  });
}

// Function to get job orders discount data
async function getJobOrdersDiscountData() {
  return new Promise((resolve, reject) => {
      google.script.run
          .withSuccessHandler(resolve)
          .withFailureHandler(reject)
          .getJobOrdersDiscountTotalsByDate();
  });
}

// Function to extract and filter dates from a file
async function extractDatesFromFile(fileId) {
  return new Promise((resolve, reject) => {
      google.script.run
          .withSuccessHandler((data) => {
              if (!data || !data.filteredTotals) {
                  console.error("No valid data extracted.");
                  resolve({});
                  return;
              }

              console.log("Extracted Totals:", data.filteredTotals);
              resolve(data.filteredTotals);
          })
          .withFailureHandler((error) => {
              console.error("Error extracting sumTotals:", error);
              reject(error);
          })
          .extractAndFilterDates(fileId);
  });
}









function formatTimestamp(timestamp) {
  return new Date(timestamp).toLocaleString('en-SG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Singapore'
  });
}

// Helper functions for file display
function getFileIcon(fileType) {
  const type = (fileType || '').toLowerCase();
  const iconMap = {
      'pdf': 'M4 4v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.342a2 2 0 0 0-.602-1.43l-4.44-4.342A2 2 0 0 0 13.56 2H6a2 2 0 0 0-2 2z',
      'document': 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6',
      'spreadsheet': 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M12 18v-4 M8 18v-2 M16 18v-6',
      'image': 'M4 16l4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2l1.586-1.586a2 2 0 0 1 2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z'
  };

  let iconPath = iconMap.document; // Default icon
  if (type.includes('pdf')) iconPath = iconMap.pdf;
  if (type.includes('sheet') || type.includes('excel')) iconPath = iconMap.spreadsheet;
  if (type.includes('image') || type.includes('jpg') || type.includes('png')) iconPath = iconMap.image;

  return `
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="${iconPath}"></path>
      </svg>
  `;
}

function truncateFileName(name, maxLength) {
  if (name.length <= maxLength) return name;
  return name.substring(0, maxLength) + '...';
}

function formatFileSize(bytes) {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}


function fetchAndDisplayFiles(folderId) {
  console.log("Fetching files for folder:", folderId); // Debugging log

  google.script.run
      .withSuccessHandler(displayFiles)
      .withFailureHandler(function (error) {
          console.error("Error fetching files:", error);
          document.getElementById("fileList").innerHTML = "<p>Error fetching files.</p>";
      })
      .getFilesInFolder(folderId);
}

function onFolderSelect(folder) {
  selectedFolder = folder;
  if (folder && folder.id) {
    console.log("Selected Folder ID:", folder.id);
      fetchAndDisplayFiles(folder.id); // Fetch and display files
  }

  // Hide the "Create Template" container initially
  const createTemplateContainer = document.getElementById("createTemplateContainer");
  createTemplateContainer.style.display = "none";

  // Clear the file list before loading new files
  const fileList = document.getElementById("fileList");
  fileList.innerHTML = "<p>Loading files...</p>";

  if (folder && folder.id) {
      fetchAndDisplayFiles(folder.id); // Fetch and display files

      // Show "Create Template" after a slight delay (ensures smooth UI)
      setTimeout(() => {
          createTemplateContainer.style.display = "block";
      }, 300);
  } else {
      fileList.innerHTML = "<p>No folder selected.</p>";
  }
}



function hideCreateTemplateModal() {
  const modal = document.getElementById("createTemplateModal"); // Assuming your modal has this ID
  if (modal) {
      modal.style.display = "none"; // Hide the modal
  } else {
      console.error("Modal element not found!");
  }
}

document.getElementById("categoryDropdown").addEventListener("change", function () {
  let selectedOption = this.options[this.selectedIndex];

  if (selectedOption.value) {
      selectedCategory = selectedOption.textContent;
      selectedSpreadsheetLink = selectedOption.getAttribute("data-link") || "";

      console.log("Selected Category:", selectedCategory);
      console.log("Spreadsheet Link:", selectedSpreadsheetLink);

      // 🔹 Show folders and hide the template container
      document.getElementById("folderDisplay").style.display = "block"; // Ensure folders are visible
      document.getElementById("folderDisplay").innerHTML = "<p>Loading folders...</p>";
      document.getElementById("createTemplateContainer").style.display = "none"; // Hide template section

      // 🔹 Clear file list
      document.getElementById("fileList").innerHTML = "";

      // 🔹 Fetch and display folders
      fetchAndDisplayFolders(selectedCategory);
  } else {
      // Reset when "Select Category" is chosen
      selectedCategory = "";
      selectedSpreadsheetLink = "";
      
      document.getElementById("folderDisplay").innerHTML = "<p>Please select a category to see folders.</p>";
      document.getElementById("folderDisplay").style.display = "block"; // Ensure folders section is visible
      document.getElementById("fileList").innerHTML = "";
      document.getElementById("createTemplateContainer").style.display = "none"; // Hide template section

      console.log("No category selected.");
  }
});


function refreshFolderList(categoryName) {
  const profileName = document.querySelector(".profile-name").textContent.trim();
  const folderDisplay = document.getElementById("folderDisplay");

  folderDisplay.innerHTML = "<p>Refreshing folder list...</p>"; // Temporary loading text

  google.script.run.withSuccessHandler(function (folders) {
      displayFolders(folders, categoryName);
  }).getUserFolders(profileName, categoryName);
}

document.addEventListener("DOMContentLoaded", function () {
  // Get modal and close button
  const createFolderModal = document.getElementById("createFolderModal");
  const closeModal = document.getElementById("closeModal");

  // Close modal when clicking the close button
  closeModal.addEventListener("click", function () {
      createFolderModal.style.display = "none";
  });

  // Optional: Close modal when clicking outside of modal content
  window.addEventListener("click", function (event) {
      if (event.target === createFolderModal) {
          createFolderModal.style.display = "none";
      }
  });
});

function renameFolder(folder, inputElement) {
  // Enable editing of the input field
  inputElement.readOnly = false;
  inputElement.focus();
  
  // Select all text for easy editing
  inputElement.setSelectionRange(0, inputElement.value.length);
  
  // Handle when user finishes editing
  const handleRenameComplete = async () => {
      const newName = inputElement.value.trim();
      
      if (!newName) {
          alert("Folder name cannot be empty");
          inputElement.value = folder.name; // Revert to original name
          inputElement.readOnly = true;
          return;
      }
      
      if (newName === folder.name) {
          inputElement.readOnly = true; // No change needed
          return;
      }
      
      try {
          // Show loading state
          inputElement.disabled = true;
          
          // Call server-side function to rename the folder
          const result = await new Promise((resolve, reject) => {
              google.script.run
                  .withSuccessHandler(resolve)
                  .withFailureHandler(reject)
                  .renameFolder(folder.id, newName, folder.category);
          });
          
          if (result.success) {
              // Update all references to the folder name
              folder.name = newName;
              
              // Update selectedFolder if it's the same folder
              if (selectedFolder && selectedFolder.id === folder.id) {
                  selectedFolder.name = newName;
              }
              
              // Optional: Show success message
              console.log("Folder renamed successfully:", newName);
          } else {
              alert(result.message || "Error renaming folder");
              inputElement.value = folder.name; // Revert to original name
          }
      } catch (error) {
          console.error("Error renaming folder:", error);
          alert("Failed to rename folder: " + error.message);
          inputElement.value = folder.name; // Revert to original name
      } finally {
          inputElement.readOnly = true;
          inputElement.disabled = false;
      }
  };
  
  // Set up event listeners for completion
  inputElement.addEventListener("blur", handleRenameComplete);
  inputElement.addEventListener("keypress", function(e) {
      if (e.key === "Enter") {
          handleRenameComplete();
      }
  });
  
  // Clean up event listeners after rename is complete
  const cleanUp = () => {
      inputElement.removeEventListener("blur", handleRenameComplete);
      inputElement.removeEventListener("keypress", handleRenameComplete);
  };
  
  // One-time cleanup after rename completes
  inputElement.addEventListener("blur", cleanUp, { once: true });
  inputElement.addEventListener("keypress", function(e) {
      if (e.key === "Enter") cleanUp();
  }, { once: true });
}

function showDeleteConfirmation(folder) {
  const deleteContainer = document.querySelector(".Delete_container");
  
  // Update modal content
  deleteContainer.innerHTML = `
      <div class="Delete_modal">
          <span class="First">Delete ${folder.name}?</span>
          <span class="Second">This will permanently delete the folder and its contents.</span>
          <div class="Delete_inner">
              <span class="confirm-delete">Delete</span>
              <span class="cancel-delete">Cancel</span>
          </div>
      </div>`;
  
  // Add event listeners
  deleteContainer.querySelector(".confirm-delete").addEventListener("click", () => {
      deleteContainer.innerHTML = "<div class='Delete_modal'><p>Deleting folder...</p></div>";
      deleteFolder(folder);
  });
  
  deleteContainer.querySelector(".cancel-delete").addEventListener("click", () => {
      deleteContainer.classList.remove("visible");
  });
  
  // Show modal
  deleteContainer.classList.add("visible");
}

async function deleteFolder(folder) {
  try {
      // Call server-side function
      const result = await new Promise((resolve, reject) => {
          google.script.run
              .withSuccessHandler(resolve)
              .withFailureHandler(reject)
              .deleteFolder(folder.id, folder.category);
      });

      if (result.success) {
          // Remove folder from UI
          const folderElements = document.querySelectorAll(".Folder");
          folderElements.forEach(element => {
              const input = element.querySelector(".yearInputFolder"); // Get the input field
              if (input && input.value === folder.name) { // Ensure input exists
                  element.remove();
              }
          });

          // Hide template container if it was showing this folder
          const templateContainer = document.getElementById("createTemplateContainer");
          if (templateContainer && templateContainer.style.display === "block") {
              templateContainer.style.display = "none";
          }

          // Show success message
          alert(`"${folder.name}" was deleted successfully`);

          // ✅ Refresh the folder list
          refreshFolderList(folder.category);
      } else {
          alert(result.message || "Failed to delete folder");
      }
  } catch (error) {
      console.error("Delete error:", error);
      alert("Error during deletion: " + error.message);
  } finally {
      // Reset delete modal
      document.querySelector(".Delete_container").classList.remove("visible");
  }
}

// Add an event listener to the "Submit" button
document.getElementById("submitFolder").addEventListener("click", function () {
  // Hide the modal immediately
  const createFolderModal = document.getElementById("createFolderModal");
  if (createFolderModal) {
      createFolderModal.style.display = "none";
  }

  // Show a loading spinner or message
  const loadingMessage = document.createElement("div");
  loadingMessage.textContent = "Creating folder...";
  document.body.appendChild(loadingMessage);

  // Get the input value
  const yearInput = document.getElementById("yearInput").value;

  // Simulate an asynchronous operation (e.g., API call)
  setTimeout(() => {
      if (yearInput && yearInput.length === 4) {
          console.log("Creating folder for year:", yearInput);

          // Clear the input field
          document.getElementById("yearInput").value = "";

          // Remove the loading message
          loadingMessage.remove();
      } else {
          // Show an error message
          alert("Please enter a valid 4-digit year.");

          // Show the modal again
          if (createFolderModal) {
              createFolderModal.style.display = "block";
          }

          // Remove the loading message
          loadingMessage.remove();
      }
  }, 2000); // Simulate a 2-second delay
});

// Reset the folder title text
const folderTitle = document.querySelector(".Folder_title span:last-child");
if (folderTitle) {
  folderTitle.textContent = ""; // Clear the folder name
  // OR if you want to restore the default text:
  // folderTitle.textContent = "Folders"; 
}

