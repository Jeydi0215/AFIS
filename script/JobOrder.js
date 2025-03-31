    document.addEventListener("DOMContentLoaded", function () {
        const table = document.querySelector(".myTable"); // Select table by class
        let selectedRow = null;

        table.addEventListener("click", function (event) {
            const clickedCell = event.target;
            const row = clickedCell.closest("tr"); // Get the parent row

            if (!row) return; // Exit if click is outside a row

            if (selectedRow === row) {
                row.style.backgroundColor = ""; // Revert color if clicking the same row again
                selectedRow = null;
            } else {
                resetRows(); // Reset all rows
                row.style.backgroundColor = "#1f549725";
                selectedRow = row;
            }
        });

        document.addEventListener("click", function (event) {
            if (!table.contains(event.target)) {
                resetRows();
                selectedRow = null;
            }
        });

        function resetRows() {
            table.querySelectorAll("tr").forEach(row => row.style.backgroundColor = "");
        }
    });

    document.addEventListener("DOMContentLoaded", function () {
        const select = document.getElementById("tableSelector");
        const table1 = document.querySelector(".Table1");
        const table2 = document.querySelector(".Table2");

        select.addEventListener("change", function () {
            if (select.value === "OEDC") {
                table1.style.display = "block";
                table2.style.display = "none";
            } else {
                table1.style.display = "none";
                table2.style.display = "block";
            }
        });
    });

    // Open and close form modal
    document.getElementById("openForm").addEventListener("click", function() {
        const modal = document.getElementById("inventoryModal");
        modal.style.display = "flex"; // Show the modal
    });
    
    document.getElementById("closeInventory").addEventListener("click", function() {
        const modal = document.getElementById("inventoryModal");
        modal.style.display = "none"; // Hide the modal
    });
    
    // Close modal when clicking outside the form - FIXED VERSION
    document.getElementById("inventoryModal").addEventListener("click", function(event) {
        if (event.target === this) {
            this.style.display = "none";
        }
    });

    let allData = [];
    
    // function fetchJobOrders() {
    //     document.getElementById("jobOrdersTable").innerHTML = `
    //     <div style="text-align: center; padding: 40px;">
    //         <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #20559A; border-radius: 50%; animation: spin 1s linear infinite; display: inline-block;"></div>
    //         <p style="margin-top: 15px; color: #20559A; font-weight: 500;">Loading job orders...</p>
    //     </div>
    //     `;
        
    //     google.script.run
    //     .withSuccessHandler(debugResponse)
    //     .withFailureHandler(handleError)
    //     .getJobOrders();
    // }

    function submitJobOrder() {
        let formData = {};
        document.querySelectorAll("#jobOrderForm input").forEach(input => {
        formData[input.name] = input.value;
        });
        
        // Log the form data to browser console for debugging
        console.log("Form data being submitted:", formData);
        
        const submitBtn = document.querySelector('button[type="button"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = "Submitting...";
        submitBtn.disabled = true;
        
        google.script.run
        .withSuccessHandler((result) => {
            console.log("Submission result:", result);
            
            // Show success message
            const successMsg = document.createElement("div");
            successMsg.style.position = "fixed";
            successMsg.style.top = "20px";
            successMsg.style.left = "50%";
            successMsg.style.transform = "translateX(-50%)";
            successMsg.style.backgroundColor = "#4CAF50";
            successMsg.style.color = "white";
            successMsg.style.padding = "16px";
            successMsg.style.borderRadius = "8px";
            successMsg.style.zIndex = "2000";
            successMsg.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
            successMsg.textContent = "Job order submitted successfully!";
            document.body.appendChild(successMsg);
            
            // Reset form and button
            document.getElementById("jobOrderForm").reset();
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            
            // Close modal
            document.getElementById("inventoryModal").classList.remove("Add_inventory");
            document.getElementById("inventoryModal").classList.add("No_inventory");
            
            // Remove success message after 3 seconds
            setTimeout(() => {
            document.body.removeChild(successMsg);
            }, 3000);
            
            // Refresh the data
            fetchJobOrders();
        })
        .withFailureHandler(error => {
            // Reset button state
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            
            // Show error message
            console.error("Submission error:", error);
            alert("Error submitting job order: " + error);
        })
        .submitJobOrder(formData);
    }

    function debugResponse(response) {
        console.log("RAW Response:", response);
        try {
        allData = JSON.parse(response);
        console.log("Parsed Data:", allData);
        displayTable(allData);
        } catch (error) {
        console.error("JSON Parse Error:", error);
        document.getElementById("jobOrdersTable").innerHTML = `
            <div style="text-align: center; padding: 40px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <h2 style="color: #e74c3c; margin-top: 10px;">Error parsing data</h2>
            <p style="margin-top: 10px; color: #666;">Please try refreshing the page</p>
            </div>
        `;
        }
    }

    function displayTable(data) {
        if (!data || data.length === 0) {
        document.getElementById("jobOrdersTable").innerHTML = `
            <div class="no-data">No job orders available</div>
        `;
        return;
        }

        // Get all unique headers from the data
        const headers = [];
        data.forEach(row => {
        Object.keys(row).forEach(key => {
            if (!headers.includes(key)) {
            headers.push(key);
            }
        });
        });

        let table = "<table><thead><tr>";

        // Add all headers
        headers.forEach(header => {
        table += `<th>${header}</th>`;
        });

        table += "</tr></thead><tbody>";

        // Display the available data with row highlighting
        data.forEach((row, index) => {
        table += `<tr class="${index % 2 === 0 ? 'even-row' : 'odd-row'}">`;
        headers.forEach(header => {
            let cellValue = row[header] !== undefined ? row[header] : '';
            
            // Format date fields if they contain date values
            if (header.includes("Date") && cellValue && !isNaN(Date.parse(cellValue))) {
            const date = new Date(cellValue);
            cellValue = date.toLocaleDateString();
            }
            
            // Format number fields
            if (header.includes("Rate") || header.includes("Amount") || header.includes("Sales")) {
            if (!isNaN(parseFloat(cellValue))) {
                cellValue = parseFloat(cellValue).toLocaleString('en-US', {
                style: 'currency',
                currency: 'PHP',
                minimumFractionDigits: 2
                });
            }
            }
            
            table += `<td>${cellValue}</td>`;
        });
        table += "</tr>";
        });

        table += "</tbody></table>";
        document.getElementById("jobOrdersTable").innerHTML = table;
    }

    function handleError(error) {
        console.error("Error fetching data:", error);
        document.getElementById("jobOrdersTable").innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <h2 style="color: #e74c3c; margin-top: 10px;">Error loading job orders</h2>
            <p style="margin-top: 10px; color: #666;">${error || 'Please try again later'}</p>
        </div>
        `;
    }
    
    // Set today's date as default for the date input
    document.addEventListener('DOMContentLoaded', function() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').value = today;
    });
    
    window.onload = fetchJobOrders;