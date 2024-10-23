document.addEventListener('DOMContentLoaded', () => {
    const saveJobBtn = document.querySelector('.save-job');
    const logJobBtn = document.querySelector('.log-job');
    const goToSheetsBtn = document.querySelector('.go-to-sheets');
    const backArrows = document.querySelectorAll('.back-arrow'); // Select all back arrows

    const actionButtons = document.querySelector('.action-buttons');
    const jobListSection = document.getElementById('job-list');
    const saveJobForm = document.getElementById('save-job-form');
    const logJobForm = document.getElementById('log-job-form');
    const jobColumns = document.getElementById('job-columns');

    // Event Listener for "Save a Job" button
    saveJobBtn.addEventListener('click', () => {
        hideAllSections();
        saveJobForm.style.display = 'block';
        actionButtons.style.display = 'none';
    });

    // Event Listener for "Log a job" button
    logJobBtn.addEventListener('click', () => {
        hideAllSections();
        logJobForm.style.display = 'block';
        actionButtons.style.display = 'none';
    });

    // Event Listener for "Go to your sheets" button
    goToSheetsBtn.addEventListener('click', () => {
        alert('Redirect to Google Sheets coming soon');
    });

    // Event Listeners for Back Arrows
    backArrows.forEach(arrow => {
        arrow.addEventListener('click', () => {
            showMainPage();
        });
    });

    // Handle form submission for saving a job
    document.getElementById('save-job').addEventListener('submit', (event) => {
        event.preventDefault();
        saveJob();
    });

    // Function to save job
    function saveJob() {
        const company = document.getElementById('company').value;
        const role = document.getElementById('role').value;
        const location = document.getElementById('location').value;
        const date = document.getElementById('date').value;

        const job = { company, role, location, date };

        // Store the job in localStorage (or chrome.storage)
        let jobs = JSON.parse(localStorage.getItem('jobs')) || [];
        jobs.push(job);
        localStorage.setItem('jobs', JSON.stringify(jobs));

        // Refresh the UI to show saved jobs
        displayJobs();
        showMainPage();
    }

    // Function to display saved jobs
    function displayJobs() {
        let jobs = JSON.parse(localStorage.getItem('jobs')) || [];
        const jobList = document.getElementById('job-list');

        // Clear current job list
        jobList.innerHTML = '';

        if (jobs.length === 0) {
            jobList.innerHTML = '<p>You currently do not have any saved job applications</p>';
        } else {
            jobs.forEach((job, index) => {
                const jobElement = document.createElement('div');
                jobElement.innerHTML = `
                    <p><strong>${job.company}</strong> - ${job.role} - ${job.location} - ${job.date}</p>
                    <button class="remove-job" data-index="${index}">Remove Job</button>
                `;
                jobList.appendChild(jobElement);
            });

            // Add event listener to remove buttons
            document.querySelectorAll('.remove-job').forEach(button => {
                button.addEventListener('click', (event) => {
                    removeJob(event.target.dataset.index);
                });
            });
        }
    }

    // Function to remove a job
    function removeJob(index) {
        let jobs = JSON.parse(localStorage.getItem('jobs')) || [];
        jobs.splice(index, 1);
        localStorage.setItem('jobs', JSON.stringify(jobs));
        displayJobs();
    }

    // Hide all sections function
    function hideAllSections() {
        jobListSection.style.display = 'none';
        jobColumns.style.display = 'none';
        saveJobForm.style.display = 'none';
        logJobForm.style.display = 'none';
    }

    // Show main page function
    function showMainPage() {
        hideAllSections();
        jobListSection.style.display = 'block';
        jobColumns.style.display = 'flex';
        actionButtons.style.display = 'flex';
    }

    // Initialize
    displayJobs();
});
