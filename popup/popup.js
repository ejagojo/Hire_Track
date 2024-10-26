// popup.js

document.addEventListener("DOMContentLoaded", () => {
    // Get elements from the DOM
    const saveJobBtn = document.querySelector(".save-job");
    const logJobBtn = document.querySelector(".log-job");
    const goToSheetsBtn = document.querySelector(".go-to-sheets");
    const regenerateSheetsBtn = document.querySelector(".regenerate-sheets");
    const backArrows = document.querySelectorAll(".back-arrow");
    const actionButtons = document.querySelector(".action-buttons");
    const jobListSection = document.getElementById("job-list");
    const saveJobForm = document.getElementById("save-job-form");
    const logJobForm = document.getElementById("log-job-form");
    const jobColumns = document.getElementById("job-columns");

    // Event Listeners

    // Regenerate Sheets Button Click
    regenerateSheetsBtn.addEventListener('click', () => {
        if (confirm('This will create a new Google Sheet and overwrite any existing data. Proceed?')) {
            chrome.identity.getAuthToken({ interactive: true }, (token) => {
                if (chrome.runtime.lastError || !token) {
                    console.error(chrome.runtime.lastError);
                    alert('Authentication failed: ' + chrome.runtime.lastError.message);
                    return;
                }

                // Clear stored IDs and create a new spreadsheet
                chrome.storage.sync.remove(['spreadsheetId', 'sheetId'], () => {
                    createSpreadsheet(token, (spreadsheetId, error) => {
                        if (error) {
                            alert('Error creating spreadsheet: ' + error.message);
                        } else {
                            alert('New spreadsheet created successfully!');
                        }
                    });
                });
            });
        }
    });

    // Show Save Job Form
    saveJobBtn.addEventListener("click", () => {
        hideAllSections();
        saveJobForm.style.display = "block";
    });

    // Show Log Job Form
    logJobBtn.addEventListener("click", () => {
        hideAllSections();
        logJobForm.style.display = "block";
    });

    // Go to Sheets
    goToSheetsBtn.addEventListener("click", () => {
        chrome.storage.sync.get("spreadsheetId", (data) => {
            if (data.spreadsheetId) {
                const url = `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`;
                window.open(url, "_blank");
            } else {
                alert("No Google Sheet found. Please log a job first.");
            }
        });
    });

    // Back to Main Page
    backArrows.forEach((arrow) => {
        arrow.addEventListener("click", () => {
            showMainPage();
        });
    });

    // Save Job Form Submission
    document.getElementById("save-job").addEventListener("submit", (event) => {
        event.preventDefault();
        saveJob();
    });

    // Log Job Form Submission
    document.getElementById("log-job").addEventListener("submit", (event) => {
        event.preventDefault();
        logJobToSheets();
    });

    // Function Definitions

    // Save Job Function
    function saveJob() {
        const company = document.getElementById("company").value.trim();
        const role = document.getElementById("role").value.trim();
        const location = document.getElementById("location").value.trim();
        const dateApplied = new Date().toLocaleDateString();
        const applicationLink = document.getElementById("application").value.trim();

        // Validate required fields
        if (!company || !role || !applicationLink) {
            alert('Please fill in all required fields.');
            return;
        }

        const job = { company, role, location, dateApplied, applicationLink };

        // Store the job using chrome.storage.local
        chrome.storage.local.get({ jobs: [] }, (result) => {
            const jobs = result.jobs;
            jobs.push(job);
            chrome.storage.local.set({ jobs }, () => {
                // Refresh the job list
                displayJobs();
                // Reset form and go back to main page
                document.getElementById("save-job").reset();
                showMainPage();
            });
        });
    }

    // Display Jobs Function
    function displayJobs() {
        chrome.storage.local.get({ jobs: [] }, (result) => {
            const jobs = result.jobs;
            const jobList = document.getElementById("job-list");

            // Clear current job list
            jobList.innerHTML = "";

            if (jobs.length === 0) {
                jobList.innerHTML =
                    "<p>You currently do not have any saved job applications</p>";
            } else {
                jobs.forEach((job, index) => {
                    const jobEntry = document.createElement("div");
                    jobEntry.classList.add("job-entry");
                    jobEntry.innerHTML = `
                        <div class="job-row">
                            <div class="job-cell">${job.company}</div>
                            <div class="job-cell">${job.role}</div>
                            <div class="job-cell">${job.location}</div>
                            <div class="job-cell">${job.dateApplied}</div>
                        </div>
                        <div class="job-actions">
                            <a href="${job.applicationLink}" target="_blank">View Application</a>
                            <button class="remove-job" data-index="${index}">Remove</button>
                        </div>
                    `;
                    jobList.appendChild(jobEntry);
                });

                // Add event listener to remove buttons
                document.querySelectorAll(".remove-job").forEach((button) => {
                    button.addEventListener("click", (event) => {
                        removeJob(event.target.dataset.index);
                    });
                });
            }
        });
    }

    // Remove Job Function
    function removeJob(index) {
        chrome.storage.local.get({ jobs: [] }, (result) => {
            const jobs = result.jobs;
            jobs.splice(index, 1);
            chrome.storage.local.set({ jobs }, () => {
                displayJobs();
            });
        });
    }

    // Log Job to Sheets Function
    function logJobToSheets() {
        const company = document.getElementById("log-company").value.trim();
        const role = document.getElementById("log-role").value.trim();
        const location = document.getElementById("log-location").value.trim();
        const status = document.getElementById("log-status").value;
        const notes = document.getElementById("log-notes").value.trim();
        const dateApplied = new Date().toLocaleDateString();

        // Validate required fields
        if (!company || !role || !location || !status) {
            alert('Please fill in all required fields.');
            return;
        }

        const job = { company, role, location, status, notes, dateApplied };

        // Get OAuth token and make API call
        chrome.identity.getAuthToken({ interactive: true }, (token) => {
            if (chrome.runtime.lastError || !token) {
                console.error(chrome.runtime.lastError);
                alert("Authentication failed: " + chrome.runtime.lastError.message);
                return;
            }

            // Get or create spreadsheet ID
            getOrCreateSpreadsheet(token, (spreadsheetId, error) => {
                if (error) {
                    alert("Error creating or accessing spreadsheet: " + error.message);
                    return;
                }

                // Log the job to Google Sheets
                appendRowToSpreadsheet(token, spreadsheetId, job, (success, error) => {
                    if (success) {
                        alert("Job successfully logged to Google Sheets!");
                        document.getElementById("log-job").reset();
                        showMainPage();
                    } else {
                        alert("Failed to log job to Google Sheets: " + error.message);
                    }
                });
            });
        });
    }

    // Function to get or create a spreadsheet
    function getOrCreateSpreadsheet(token, callback) {
        chrome.storage.sync.get(['spreadsheetId', 'sheetId'], (data) => {
            if (data.spreadsheetId && data.sheetId) {
                // Check if the spreadsheet still exists
                checkSpreadsheetExists(token, data.spreadsheetId, (exists) => {
                    if (exists) {
                        // Spreadsheet exists
                        callback(data.spreadsheetId);
                    } else {
                        // Spreadsheet doesn't exist
                        if (confirm('Your Google Sheet was not found. Would you like to create a new one?')) {
                            // Clear stored IDs and create a new spreadsheet
                            chrome.storage.sync.remove(['spreadsheetId', 'sheetId'], () => {
                                createSpreadsheet(token, callback);
                            });
                        } else {
                            callback(null, new Error('Spreadsheet not found.'));
                        }
                    }
                });
            } else {
                // Create a new spreadsheet
                createSpreadsheet(token, callback);
            }
        });
    }

    // Function to check if the spreadsheet exists
    function checkSpreadsheetExists(token, spreadsheetId, callback) {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=spreadsheetId`;

        fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
        })
            .then(response => {
                if (response.status === 200) {
                    callback(true);
                } else {
                    callback(false);
                }
            })
            .catch(error => {
                console.error('Error checking spreadsheet:', error);
                callback(false);
            });
    }

    // Function to create a new spreadsheet with formatting
    function createSpreadsheet(token, callback) {
        const url = "https://sheets.googleapis.com/v4/spreadsheets";

        const body = {
            properties: {
                title: "Hire Track Job Applications",
            },
            sheets: [
                {
                    properties: {
                        title: "Applications",
                    },
                    data: [
                        {
                            rowData: [
                                {
                                    values: [
                                        {
                                            userEnteredValue: { stringValue: "Company" },
                                            userEnteredFormat: { textFormat: { bold: true } },
                                        },
                                        {
                                            userEnteredValue: { stringValue: "Role" },
                                            userEnteredFormat: { textFormat: { bold: true } },
                                        },
                                        {
                                            userEnteredValue: { stringValue: "Location" },
                                            userEnteredFormat: { textFormat: { bold: true } },
                                        },
                                        {
                                            userEnteredValue: { stringValue: "Date Applied" },
                                            userEnteredFormat: { textFormat: { bold: true } },
                                        },
                                        {
                                            userEnteredValue: { stringValue: "Status" },
                                            userEnteredFormat: { textFormat: { bold: true } },
                                        },
                                        {
                                            userEnteredValue: { stringValue: "Notes" },
                                            userEnteredFormat: { textFormat: { bold: true } },
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        };

        fetch(url, {
            method: "POST",
            headers: {
                Authorization: "Bearer " + token,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.error) {
                    console.error("Error creating spreadsheet:", data.error);
                    callback(null, data.error);
                } else {
                    const spreadsheetId = data.spreadsheetId;
                    const sheetId = data.sheets[0].properties.sheetId; // Retrieve the sheetId

                    // Store both spreadsheetId and sheetId
                    chrome.storage.sync.set({ spreadsheetId, sheetId }, () => {
                        // Apply additional formatting and data validation
                        formatSpreadsheet(
                            token,
                            spreadsheetId,
                            sheetId,
                            (success, error) => {
                                if (success) {
                                    callback(spreadsheetId);
                                } else {
                                    callback(null, error);
                                }
                            }
                        );
                    });
                }
            })
            .catch((error) => {
                console.error("Error creating spreadsheet:", error);
                callback(null, error);
            });
    }

    // Function to apply formatting and data validation to the spreadsheet
    function formatSpreadsheet(token, spreadsheetId, sheetId, callback) {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;

        const body = {
            requests: [
                // Set column widths
                {
                    updateDimensionProperties: {
                        range: {
                            sheetId: sheetId,
                            dimension: "COLUMNS",
                            startIndex: 0,
                            endIndex: 6,
                        },
                        properties: {
                            pixelSize: 150,
                        },
                        fields: "pixelSize",
                    },
                },
                // Set header text format (bold)
                {
                    repeatCell: {
                        range: {
                            sheetId: sheetId,
                            startRowIndex: 0,
                            endRowIndex: 1,
                        },
                        cell: {
                            userEnteredFormat: {
                                textFormat: {
                                    bold: true,
                                },
                                // Do not set backgroundColor here to avoid affecting data cells
                            },
                        },
                        fields: "userEnteredFormat(textFormat)",
                    },
                },
                // Add data validation (dropdown) for Status column (E)
                {
                    setDataValidation: {
                        range: {
                            sheetId: sheetId,
                            startRowIndex: 1,
                            startColumnIndex: 4,
                            endColumnIndex: 5,
                        },
                        rule: {
                            condition: {
                                type: "ONE_OF_LIST",
                                values: [
                                    { userEnteredValue: "Applied" },
                                    { userEnteredValue: "Interviewing" },
                                    { userEnteredValue: "Offer" },
                                    { userEnteredValue: "Rejected" },
                                ],
                            },
                            showCustomUi: true,
                            strict: true,
                        },
                    },
                },
                // Freeze header row
                {
                    updateSheetProperties: {
                        properties: {
                            sheetId: sheetId,
                            gridProperties: {
                                frozenRowCount: 1,
                            },
                        },
                        fields: "gridProperties.frozenRowCount",
                    },
                },
            ],
        };

        fetch(url, {
            method: "POST",
            headers: {
                Authorization: "Bearer " + token,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.error) {
                    console.error("Error formatting spreadsheet:", data.error);
                    callback(false, data.error);
                } else {
                    callback(true);
                }
            })
            .catch((error) => {
                console.error("Error formatting spreadsheet:", error);
                callback(false, error);
            });
    }

    // Function to append a row to the spreadsheet
    function appendRowToSpreadsheet(token, spreadsheetId, job, callback) {
        const sheetName = 'Applications';
        const range = `'${sheetName}'!A:F`;

        // Check if the sheet exists
        checkSheetExists(token, spreadsheetId, sheetName, (sheetExists) => {
            if (!sheetExists) {
                if (confirm(`The sheet "${sheetName}" does not exist. Would you like to recreate it?`)) {
                    // Recreate the sheet and then append the data
                    createSheet(token, spreadsheetId, sheetName, (success, error) => {
                        if (success) {
                            // Proceed to append data after sheet creation
                            appendDataToSheet();
                        } else {
                            callback(false, error);
                        }
                    });
                } else {
                    callback(false, new Error('Sheet not found.'));
                }
            } else {
                // Sheet exists, proceed to append data
                appendDataToSheet();
            }
        });

        function appendDataToSheet() {
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
            const body = {
                values: [
                    [job.company, job.role, job.location, job.dateApplied, job.status, job.notes]
                ]
            };

            fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            })
                .then(response => response.json())
                .then(appendData => {
                    if (appendData.error) {
                        console.error('Error appending to spreadsheet:', appendData.error);
                        callback(false, appendData.error);
                    } else {
                        callback(true);
                    }
                })
                .catch(error => {
                    console.error('Error appending to spreadsheet:', error);
                    callback(false, error);
                });
        }
    }

    // Function to check if a sheet exists within the spreadsheet
    function checkSheetExists(token, spreadsheetId, sheetName, callback) {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`;

        fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
        })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.error('Error checking sheets:', data.error);
                    callback(false);
                } else {
                    const sheets = data.sheets || [];
                    const exists = sheets.some(sheet => sheet.properties.title === sheetName);
                    callback(exists);
                }
            })
            .catch(error => {
                console.error('Error checking sheets:', error);
                callback(false);
            });
    }

    // Function to create a new sheet within the spreadsheet
    function createSheet(token, spreadsheetId, sheetName, callback) {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;

        const body = {
            requests: [
                {
                    addSheet: {
                        properties: {
                            title: sheetName
                        }
                    }
                }
            ]
        };

        fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.error('Error creating sheet:', data.error);
                    callback(false, data.error);
                } else {
                    // Get the new sheetId
                    const sheetId = data.replies[0].addSheet.properties.sheetId;
                    // Optionally store the new sheetId
                    chrome.storage.sync.set({ sheetId }, () => {
                        // Apply formatting to the new sheet
                        formatSpreadsheet(token, spreadsheetId, sheetId, (success, error) => {
                            if (success) {
                                callback(true);
                            } else {
                                callback(false, error);
                            }
                        });
                    });
                }
            })
            .catch(error => {
                console.error('Error creating sheet:', error);
                callback(false, error);
            });
    }

    // Hide All Sections Function
    function hideAllSections() {
        jobListSection.style.display = "none";
        jobColumns.style.display = "none";
        saveJobForm.style.display = "none";
        logJobForm.style.display = "none";
        actionButtons.style.display = "none";
    }

    // Show Main Page Function
    function showMainPage() {
        hideAllSections();
        jobListSection.style.display = "block";
        jobColumns.style.display = "flex";
        actionButtons.style.display = "flex";
    }

    // Show Form Function
    window.showForm = function (formId) {
        hideAllSections();
        document.getElementById(formId).style.display = "block";
    };

    // Go Back Function
    window.goBack = function () {
        showMainPage();
    };

    // Initialize the extension
    showMainPage();
    displayJobs();
});
