// background.js

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'logJobToSheets') {
        getOrCreateSpreadsheet((spreadsheetId, error) => {
            if (error) {
                sendResponse({ success: false, error });
            } else {
                logJobToSheets(request.job, spreadsheetId, sendResponse);
            }
        });
        return true; // Indicates that sendResponse will be called asynchronously
    }
});

// Function to create or get existing spreadsheet
function getOrCreateSpreadsheet(callback) {
    chrome.storage.sync.get('spreadsheetId', (data) => {
        if (data.spreadsheetId) {
            // Spreadsheet already exists, return its ID
            callback(data.spreadsheetId);
        } else {
            // Create a new spreadsheet
            createNewSpreadsheet(callback);
        }
    });
}

// Function to create a new Google Spreadsheet for the user
function createNewSpreadsheet(callback) {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError || !token) {
            console.error(chrome.runtime.lastError);
            callback(null, chrome.runtime.lastError);
            return;
        }

        const url = 'https://sheets.googleapis.com/v4/spreadsheets';

        const body = {
            properties: {
                title: 'Hire Track Job Applications'
            },
            sheets: [{
                properties: {
                    title: 'Sheet1'
                }
            }]
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
                    console.error('Error creating spreadsheet:', data.error);
                    callback(null, data.error);
                } else {
                    const spreadsheetId = data.spreadsheetId;

                    // Store the new spreadsheet ID in Chrome storage
                    chrome.storage.sync.set({ spreadsheetId }, () => {
                        callback(spreadsheetId);  // Return the spreadsheetId
                    });
                }
            })
            .catch(error => {
                console.error('Error creating spreadsheet:', error);
                callback(null, error);
            });
    });
}

// Function to log job to Google Sheets
function logJobToSheets(job, spreadsheetId, callback) {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError || !token) {
            console.error(chrome.runtime.lastError);
            callback({ success: false, error: chrome.runtime.lastError });
            return;
        }

        const range = 'Sheet1!A:E';  // Adjust the range as needed
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=RAW`;

        const body = {
            values: [
                [job.company, job.role, job.location, job.dateApplied, job.notes]
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
                    console.error('Error logging job to Google Sheets:', data.error);
                    callback({ success: false, error: data.error });
                } else {
                    callback({ success: true });
                }
            })
            .catch(error => {
                console.error('Error logging job to Google Sheets:', error);
                callback({ success: false, error });
            });
    });
}
