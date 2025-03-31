function openModal() {
  document.getElementById("formModal").style.display = "flex";
}

function closeModal() {
  document.getElementById("formModal").style.display = "none";
}

function submitCashDisbursement() {
  let formData = {};
  document.querySelectorAll("#CashForm input").forEach((input) => {
    if (input.type !== "file") {
      formData[input.name] = input.value;
    }
  });

  let fileInput = document.getElementById("receiptUpload");
  let file = fileInput.files[0];

  if (file) {
    let reader = new FileReader();
    reader.onload = function (e) {
      google.script.run
        .withSuccessHandler(() => {
          alert("Disbursement submitted successfully!");
          document.getElementById("CashForm").reset();
          closeModal();
          fetchCashDisbursement();
        })
        .withFailureHandler((error) => {
          alert("Error submitting Cash Disbursement: " + error);
        })
        .submitCashDisbursement(formData, e.target.result, file.name);
    };
    reader.readAsDataURL(file);
  } else {
    alert("Please upload a receipt image.");
  }
}

window.onclick = function (event) {
  let modal = document.getElementById("formModal");
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

function fetchCashDisbursement() {
  google.script.run
    .withSuccessHandler(debugResponse)
    .withFailureHandler(handleError)
    .getCashDisbursement();
}

function debugResponse(response) {
  console.log("RAW Response:", response);
  try {
    let data = JSON.parse(response);
    console.log("Parsed Data:", data);
    displayTable(data);
  } catch (error) {
    console.error("JSON Parse Error:", error);
    document.getElementById("CashDisbursementTable").innerHTML =
      "<h2>Error parsing data</h2>";
  }
}

function displayTable(data) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    document.getElementById("CashDisbursementTable").innerHTML =
      "<h2>No Cash Disbursement Records Available</h2>";
    return;
  }

  let headers = Object.keys(data[0]);
  let table = "<table><thead><tr>";

  headers.forEach((header) => {
    table += `<th>${header}</th>`;
  });

  table += "</tr></thead><tbody>";

  data.forEach((row) => {
    table += "<tr>";
    headers.forEach((header) => {
      if (header === "Date" && row[header]) {
        // Convert ISO date to readable format
        let formattedDate = new Date(row[header]).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        table += `<td>${formattedDate}</td>`;
      } else if (header === "Receipts" && row[header]) {
        // Show "View Receipt" button
        table += `<td><a href="${row[header]}" target="_blank" class="view-receipt-btn">View Receipt</a></td>`;
      } else {
        table += `<td>${row[header] || ""}</td>`;
      }
    });
    table += "</tr>";
  });

  table += "</tbody></table>";
  document.getElementById("CashDisbursementTable").innerHTML = table;
}

function handleError(error) {
  console.error("Error fetching data:", error);
  document.getElementById("CashDisbursementTable").innerHTML =
    "<h2>Error loading Cash Disbursement data</h2>";
}

window.onload = fetchCashDisbursement;
