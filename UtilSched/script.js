const courses = {
    1: [],
    2: [],
    3: [],
    4: []
};

// Define sections for each year level
const sections = {
    1: ['1A', '1B', '1C', '1D', '1E'],
    2: ['2A', '2B', '2C', '2D', '2E'],
    3: ['3A', '3B', '3C', '3D', '3E'],
    4: ['4A', '4B', '4C', '4D', '4E']
};

let currentYearTab = 1;
let currentSection = null;
let schedule = {};
let editingCourseId = null;

const yearButtons = document.querySelectorAll('.year-btn');
const yearTabs = document.querySelectorAll('.year-tab');
const addCourseBtn = document.getElementById('addCourseBtn');
const automateScheduleBtn = document.getElementById('automateScheduleBtn');
const clearScheduleBtn = document.getElementById('clearScheduleBtn');
const courseList = document.getElementById('courseList');
const scheduleTable = document.getElementById('scheduleTable');

function initializeScheduleTable() {
    const tbody = scheduleTable.querySelector('tbody');
    tbody.innerHTML = '';
    
    for (let hour = 8; hour <= 16; hour++) {
        createTimeRow(tbody, hour, 0);
        createTimeRow(tbody, hour, 30);
    }
}

function createTimeRow(tbody, hour, minutes) {
    const row = document.createElement('tr');
    
    const startTime = formatTime12Hour(hour, minutes);
    const endTime = formatTime12Hour(minutes === 30 ? hour + 1 : hour, minutes === 30 ? 0 : 30);
    
    const timeCell = document.createElement('td');
    timeCell.className = 'time-slot';
    timeCell.textContent = `${startTime} - ${endTime}`;
    row.appendChild(timeCell);
    
    for (let day = 1; day <= 5; day++) {
        const cell = document.createElement('td');
        cell.className = 'schedule-cell';
        cell.dataset.time = `${hour}:${minutes === 0 ? '00' : minutes}`;
        cell.dataset.day = day;
        row.appendChild(cell);
    }
    
    tbody.appendChild(row);
}

function formatTime12Hour(hour, minutes) {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    return `${displayHour}:${minutes === 0 ? '00' : minutes} ${period}`;
}

function init() {
    loadFromLocalStorage();
    initializeScheduleTable();
    setupEventListeners();
    createSectionTabs();
    updateCourseList();
    updateTableHeader();
}

function createSectionTabs() {
    // Create section tabs for the selected year
    const sectionTabsContainer = document.createElement('div');
    sectionTabsContainer.id = 'sectionTabs';
    sectionTabsContainer.className = 'section-tabs';
    
    const yearLevel = currentYearTab;
    
    if (sections[yearLevel]) {
        sections[yearLevel].forEach((section, index) => {
            const sectionTab = document.createElement('div');
            sectionTab.className = 'section-tab' + (index === 0 ? ' active' : '');
            sectionTab.dataset.section = section;
            sectionTab.textContent = section;
            sectionTabsContainer.appendChild(sectionTab);
            
            // Set the initial current section if not set
            if (index === 0 && !currentSection) {
                currentSection = section;
            }
        });
    }
    
    // Insert after year tabs
    const yearTabsContainer = document.querySelector('.year-tabs');
    if (yearTabsContainer.nextElementSibling) {
        yearTabsContainer.parentNode.insertBefore(sectionTabsContainer, yearTabsContainer.nextElementSibling);
    } else {
        yearTabsContainer.parentNode.appendChild(sectionTabsContainer);
    }
    
    // Add event listeners to section tabs
    document.querySelectorAll('.section-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.section-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            currentSection = tab.dataset.section;
            updateCourseList();
            clearSchedule();
        });
    });
}

function updateSectionTabs() {
    // Remove existing section tabs
    const existingSectionTabs = document.getElementById('sectionTabs');
    if (existingSectionTabs) {
        existingSectionTabs.remove();
    }
    
    // Create new section tabs
    createSectionTabs();
}

function updateTableHeader() {
    const headerRow = scheduleTable.querySelector('thead tr');
    
    while (headerRow.children.length > 6) {
        headerRow.removeChild(headerRow.lastChild);
    }
    
    // Update header to show current section
    const scheduleTitle = document.querySelector('.schedule-container h2');
    if (scheduleTitle && currentSection) {
        scheduleTitle.textContent = `Schedule - Section ${currentSection}`;
    }
}

function setupEventListeners() {
    yearButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            yearButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const yearLevel = parseInt(btn.dataset.year);
            document.getElementById('yearLevel').value = yearLevel;
        });
    });
    
    yearTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            yearTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            currentYearTab = parseInt(tab.dataset.year);
            updateSectionTabs(); // Update section tabs when year changes
            updateCourseList();
            clearSchedule();
        });
    });
    
    addCourseBtn.addEventListener('click', saveOrUpdateCourse);
    automateScheduleBtn.addEventListener('click', automateSchedule);
    clearScheduleBtn.addEventListener('click', clearSchedule);
    
    // Add section dropdown to the course form if not already there
    if (!document.getElementById('sectionSelect')) {
        addSectionSelectToForm();
    }
}

function addSectionSelectToForm() {
    // Create section selection dropdown
    const formGroup = document.createElement('div');
    formGroup.className = 'form-group';
    
    const label = document.createElement('label');
    label.setAttribute('for', 'sectionSelect');
    label.textContent = 'Section:';
    
    const select = document.createElement('select');
    select.id = 'sectionSelect';
    
    // Add the form group after the year level selection
    const yearLevelGroup = document.getElementById('yearLevel').closest('.form-group');
    yearLevelGroup.parentNode.insertBefore(formGroup, yearLevelGroup.nextSibling);
    
    formGroup.appendChild(label);
    formGroup.appendChild(select);
    
    // Update section options when year level changes
    document.getElementById('yearLevel').addEventListener('change', updateSectionOptions);
    
    // Initialize section options
    updateSectionOptions();
}

function updateSectionOptions() {
    const yearLevel = parseInt(document.getElementById('yearLevel').value);
    const sectionSelect = document.getElementById('sectionSelect');
    
    sectionSelect.innerHTML = '';
    
    if (sections[yearLevel]) {
        sections[yearLevel].forEach(section => {
            const option = document.createElement('option');
            option.value = section;
            option.textContent = section;
            sectionSelect.appendChild(option);
        });
    }
}

function saveOrUpdateCourse() {
    const courseCode = document.getElementById('courseCode').value.trim();
    const courseName = document.getElementById('courseName').value.trim();
    const profName = document.getElementById('profName').value.trim();
    const room = document.getElementById('room').value.trim();
    const units = parseInt(document.getElementById('units').value);
    const duration = parseInt(document.getElementById('duration').value);
    const yearLevel = parseInt(document.getElementById('yearLevel').value);
    const courseColor = document.getElementById('courseColor').value;
    const section = document.getElementById('sectionSelect').value;
    
    if (!courseCode || !courseName || !profName || !room || !section) {
        alert('Please fill in all fields');
        return;
    }
    
    const course = {
        code: courseCode,
        name: courseName,
        prof: profName,
        room: room,
        units: units,
        duration: duration,
        yearLevel: yearLevel,
        section: section,
        color: courseColor,
        sessionsPerWeek: units
    };
    
    if (editingCourseId !== null) {
        const yearLevelArr = courses[yearLevel];
        const courseIndex = yearLevelArr.findIndex(c => c.id === editingCourseId);
        
        if (courseIndex !== -1) {
            course.id = editingCourseId;
            yearLevelArr[courseIndex] = course;
            
            alert(`Course ${courseCode}: ${courseName} has been updated successfully!`);
        }
        
        editingCourseId = null;
        addCourseBtn.textContent = 'Add Course';
    } else {
        course.id = Date.now();
        courses[yearLevel].push(course);
        
        alert(`Course ${courseCode}: ${courseName} has been added successfully!`);
    }
    
    saveToLocalStorage();
    resetCourseForm();
    updateCourseList();
    clearSchedule();
}

function resetCourseForm() {
    document.getElementById('courseCode').value = '';
    document.getElementById('courseName').value = '';
    document.getElementById('profName').value = '';
    document.getElementById('room').value = '';
    document.getElementById('units').value = '3';
    document.getElementById('duration').value = '60';
    document.getElementById('courseColor').value = '#3498db';
    
    editingCourseId = null;
    addCourseBtn.textContent = 'Add Course';
}

function editCourse(courseId) {
    const course = courses[currentYearTab].find(c => c.id === courseId);
    
    if (!course) return;
    
    document.getElementById('courseCode').value = course.code;
    document.getElementById('courseName').value = course.name;
    document.getElementById('profName').value = course.prof;
    document.getElementById('room').value = course.room;
    document.getElementById('units').value = course.units;
    document.getElementById('duration').value = course.duration;
    document.getElementById('yearLevel').value = course.yearLevel;
    document.getElementById('courseColor').value = course.color;
    
    // Update section selection
    const sectionSelect = document.getElementById('sectionSelect');
    updateSectionOptions(); // Ensure options are updated for the selected year
    
    // Set the correct section
    if (course.section) {
        for (let i = 0; i < sectionSelect.options.length; i++) {
            if (sectionSelect.options[i].value === course.section) {
                sectionSelect.selectedIndex = i;
                break;
            }
        }
    }
    
    editingCourseId = courseId;
    addCourseBtn.textContent = 'Update Course';
    
    document.querySelector('.course-form').scrollIntoView({ behavior: 'smooth' });
}

function updateCourseList() {
    const yearCourses = courses[currentYearTab].filter(course => 
        currentSection ? course.section === currentSection : true
    );
    
    if (yearCourses.length === 0) {
        courseList.innerHTML = '<div class="empty-state">No courses added yet for this section. Use the form to add courses.</div>';
        return;
    }
    
    courseList.innerHTML = '';
    
    yearCourses.forEach(course => {
        const courseItem = document.createElement('div');
        courseItem.className = 'course-item';
        
        courseItem.innerHTML = `
            <div class="course-item-left">
                <div class="course-color" style="background-color: ${course.color}"></div>
                <div class="course-details">
                    <h3>${course.code}: ${course.name}</h3>
                    <p>${course.prof} | ${course.room} | ${course.units} units | ${formatDuration(course.duration)} | Section ${course.section}</p>
                </div>
            </div>
            <div class="course-actions">
                <button class="edit-btn" data-id="${course.id}"><i class="fas fa-edit"></i></button>
                <button class="delete-btn" data-id="${course.id}"><i class="fas fa-trash"></i></button>
            </div>
        `;
        
        courseList.appendChild(courseItem);
    });
    
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const courseId = parseInt(e.currentTarget.dataset.id);
            editCourse(courseId);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const courseId = parseInt(e.currentTarget.dataset.id);
            deleteCourse(courseId);
        });
    });
    
    updateTableHeader();
}

function deleteCourse(courseId) {
    if (confirm('Are you sure you want to delete this course?')) {
        courses[currentYearTab] = courses[currentYearTab].filter(course => course.id !== courseId);
        saveToLocalStorage();
        updateCourseList();
        clearSchedule();
    }
}

function formatDuration(minutes) {
    if (minutes === 60) return '1 hour';
    if (minutes === 90) return '1 hour 30 minutes';
    if (minutes === 120) return '2 hours';
    if (minutes === 150) return '2 hours 30 minutes';
    if (minutes === 180) return '3 hours';
    return `${minutes} minutes`;
}

function clearSchedule() {
    document.querySelectorAll('.schedule-item').forEach(item => {
        item.remove();
    });
    schedule = {};
}

function automateSchedule() {
    clearSchedule();
    
    if (!currentSection) {
        alert('Please select a section first');
        return;
    }
    
    // Only schedule courses for the current section
    const sectionCourses = [];
    for (let year = 1; year <= 4; year++) {
        courses[year].forEach(course => {
            if (course.section === currentSection) {
                for (let session = 1; session <= course.sessionsPerWeek; session++) {
                    const courseCopy = {...course};
                    courseCopy.sessionId = session;
                    sectionCourses.push(courseCopy);
                }
            }
        });
    }
    
    if (sectionCourses.length === 0) {
        alert(`Please add courses for section ${currentSection} first before automating the schedule`);
        return;
    }
    
    sectionCourses.sort((a, b) => b.duration - a.duration);
    
    const result = scheduleAllCoursesWithRoomCheck(sectionCourses);
    
    if (result.success) {
        alert(`Schedule for Section ${currentSection} automated successfully!`);
    } else {
        alert(`Could not schedule all course sessions for Section ${currentSection}. ${result.scheduledCount} out of ${sectionCourses.length} sessions were scheduled. Some courses may conflict or there may not be enough time slots.`);
    }
}

function scheduleAllCoursesWithRoomCheck(courses) {
    const days = [1, 2, 3, 4, 5];
    
    const timeSlots = [];
    for (let hour = 8; hour <= 16; hour++) {
        timeSlots.push(`${hour}:00`);
        if (hour < 16) {
            timeSlots.push(`${hour}:30`);
        }
    }
    // Added 16:30 as the last time slot
    timeSlots.push(`16:30`);
    
    let scheduledCount = 0;
    
    const courseSessionsByDay = {};
    const roomSchedule = {};
    const professorSchedule = {}; // To prevent professor conflicts
    
    for (const course of courses) {
        const slotsNeeded = course.duration / 30;
        
        let scheduled = false;
        
        const courseKey = `${course.code}-${course.id}`;
        if (!courseSessionsByDay[courseKey]) {
            courseSessionsByDay[courseKey] = {};
        }
        
        const sortedDays = [...days].sort((a, b) => {
            const sessionsOnDayA = courseSessionsByDay[courseKey][a] || 0;
            const sessionsOnDayB = courseSessionsByDay[courseKey][b] || 0;
            return sessionsOnDayA - sessionsOnDayB;
        });
        
        for (const day of sortedDays) {
            if (scheduled) break;
            
            for (let startIndex = 0; startIndex < timeSlots.length - slotsNeeded + 1; startIndex++) {
                const startSlot = timeSlots[startIndex];
                
                let available = true;
                for (let i = 0; i < slotsNeeded; i++) {
                    const slotIndex = startIndex + i;
                    const currentSlot = timeSlots[slotIndex];
                    const slotKey = `${day}-${currentSlot}`;
                    const roomKey = `${course.room}-${day}-${currentSlot}`;
                    const profKey = `${course.prof}-${day}-${currentSlot}`;
                    
                    // Check for conflicts with the current section's schedule
                    if (schedule[slotKey]) {
                        available = false;
                        break;
                    }
                    
                    // Check for room conflicts
                    if (roomSchedule[roomKey]) {
                        available = false;
                        break;
                    }
                    
                    // Check for professor conflicts
                    if (professorSchedule[profKey]) {
                        available = false;
                        break;
                    }
                }
                
                if (available) {
                    for (let i = 0; i < slotsNeeded; i++) {
                        const slotIndex = startIndex + i;
                        const currentSlot = timeSlots[slotIndex];
                        const slotKey = `${day}-${currentSlot}`;
                        const roomKey = `${course.room}-${day}-${currentSlot}`;
                        const profKey = `${course.prof}-${day}-${currentSlot}`;
                        
                        schedule[slotKey] = course;
                        roomSchedule[roomKey] = course;
                        professorSchedule[profKey] = course;
                    }
                    
                    courseSessionsByDay[courseKey][day] = (courseSessionsByDay[courseKey][day] || 0) + 1;
                    
                    addCourseToSchedule(course, day, startSlot, slotsNeeded);
                    
                    scheduled = true;
                    scheduledCount++;
                    break;
                }
            }
        }
    }
    
    return { 
        success: scheduledCount === courses.length,
        scheduledCount: scheduledCount,
        totalCourses: courses.length
    };
}

function addCourseToSchedule(course, day, startTime, slots) {
    const [hour, minute] = startTime.split(':').map(num => parseInt(num));
    
    const cell = document.querySelector(`.schedule-cell[data-day="${day}"][data-time="${startTime}"]`);
    
    if (!cell) return false;
    
    const courseElement = document.createElement('div');
    courseElement.className = 'schedule-item';
    courseElement.style.backgroundColor = course.color;
    
    // Calculate the correct height based on the duration in minutes
    // Each 30-minute slot should represent 100% of the cell height
    courseElement.style.height = `${(course.duration / 30) * 150}%`;
    
    courseElement.innerHTML = `
        <div class="course-code">${course.code}</div>
        <div class="course-name">${course.name}</div>
        <div class="course-prof">${course.prof}</div>
        <div class="course-room">${course.room}</div>
        <div class="course-section">Section ${course.section}</div>
    `;
    
    cell.appendChild(courseElement);
    return true;
}

function addCancelButton() {
    if (editingCourseId !== null) {
        const courseForm = document.querySelector('.course-form');
        
        if (!document.getElementById('cancelEditBtn')) {
            const cancelBtn = document.createElement('button');
            cancelBtn.id = 'cancelEditBtn';
            cancelBtn.className = 'btn secondary-btn';
            cancelBtn.style.marginLeft = '10px';
            cancelBtn.textContent = 'Cancel';
            
            cancelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                resetCourseForm();
            });
            
            addCourseBtn.parentNode.insertBefore(cancelBtn, addCourseBtn.nextSibling);
        }
    } else {
        const cancelBtn = document.getElementById('cancelEditBtn');
        if (cancelBtn) {
            cancelBtn.remove();
        }
    }
}

function saveToLocalStorage() {
    localStorage.setItem('courseScheduler', JSON.stringify(courses));
}

function loadFromLocalStorage() {
    const savedData = localStorage.getItem('courseScheduler');
    if (savedData) {
        const parsedData = JSON.parse(savedData);
        Object.keys(parsedData).forEach(key => {
            courses[key] = parsedData[key];
        });
        
        // Add section field to older courses if missing
        for (let year = 1; year <= 4; year++) {
            courses[year].forEach(course => {
                if (!course.section) {
                    course.section = `${year}A`; // Default to first section
                }
            });
        }
    }
}

function printSchedule() {
    const printContent = document.createElement('div');
    printContent.innerHTML = `
        <style>
            @media print {
                body { font-family: Arial, sans-serif; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #000; padding: 8px; text-align: center; }
                .time-slot { font-weight: bold; }
                .schedule-item { 
                    padding: 4px;
                    margin: 2px;
                    border-radius: 4px;
                }
                .course-code { font-weight: bold; }
                h1 { text-align: center; }
                @page { size: landscape; }
            }
        </style>
        <h1>BEED DMMMSU MLUC Schedule - Section ${currentSection}</h1>
    `;
    
    const tableClone = scheduleTable.cloneNode(true);
    printContent.appendChild(tableClone);
    
    const printWindow = window.open('', '_blank');
    printWindow.document.open();
    printWindow.document.write(printContent.innerHTML);
    printWindow.document.close();
    
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
}

function saveAsPDF() {
    window.print();
}

function addPrintAndSaveButtons() {
    const scheduleContainer = document.querySelector('.schedule-container');
    
    // Remove existing buttons if they exist
    const existingButtons = document.querySelector('.schedule-buttons');
    if (existingButtons) {
        existingButtons.remove();
    }
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'schedule-buttons';
    buttonContainer.style.marginTop = '15px';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '10px';
    buttonContainer.style.justifyContent = 'center';
    
    const printButton = document.createElement('button');
    printButton.id = 'printScheduleBtn';
    printButton.className = 'btn secondary-btn';
    printButton.innerHTML = '<i class="fas fa-print"></i> Print Schedule';
    printButton.addEventListener('click', printSchedule);
    
    const saveButton = document.createElement('button');
    saveButton.id = 'savePdfBtn';
    saveButton.className = 'btn secondary-btn';
    saveButton.innerHTML = '<i class="fas fa-file-pdf"></i> Save as PDF';
    saveButton.addEventListener('click', saveAsPDF);
    
    buttonContainer.appendChild(printButton);
    buttonContainer.appendChild(saveButton);
    scheduleContainer.appendChild(buttonContainer);
}

function addPrintStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
        @media print {
            body * {
                visibility: hidden;
            }
            .schedule-container, .schedule-container * {
                visibility: visible;
            }
            .schedule-container {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
            }
            .schedule-buttons {
                display: none !important;
            }
            header, footer, .course-management, .year-selector, .section-tabs {
                display: none !important;
            }
        }
    `;
    document.head.appendChild(style);
}

function addSectionStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
        .section-tabs {
            display: flex;
            justify-content: center;
            margin-bottom: 15px;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .section-tab {
            padding: 8px 15px;
            margin: 0 5px;
            cursor: pointer;
            border-radius: 5px 5px 0 0;
            transition: all 0.3s;
        }
        
        .section-tab:hover {
            background-color: #f0f0f0;
        }
        
        .section-tab.active {
            background-color: #3498db;
            color: white;
            font-weight: bold;
        }
        
        .schedule-item .course-section {
            font-size: 0.8em;
            font-style: italic;
        }
    `;
    document.head.appendChild(style);
}

document.addEventListener('DOMContentLoaded', function() {
    addPrintStyles();
    addSectionStyles();
    init();
    
    addCourseBtn.addEventListener('click', function() {
        setTimeout(addCancelButton, 100);
    });
    
    const originalEditCourse = editCourse;
    editCourse = function(courseId) {
        originalEditCourse(courseId);
        addCancelButton();
    };
    
    addPrintAndSaveButtons();
});

function generateRandomColor() {
    // Create an array of pleasant, distinguishable colors for courses
    const colorPalette = [
        // Original colors
        "#3498db", // Blue
        "#2ecc71", // Green
        "#e74c3c", // Red
        "#9b59b6", // Purple
        "#f1c40f", // Yellow
        "#1abc9c", // Turquoise
        "#d35400", // Orange
        "#34495e", // Dark Blue
        "#16a085", // Sea Green
        "#c0392b", // Dark Red
        "#8e44ad", // Dark Purple
        "#27ae60", // Emerald
        "#f39c12", // Orange/Yellow
        "#2980b9", // Dark Blue
        "#e67e22", // Pumpkin
        
        // Additional light colors
        "#AED6F1", // Light Blue
        "#A3E4D7", // Light Turquoise
        "#F9E79F", // Light Yellow
        "#D7BDE2", // Light Purple
        "#FADBD8", // Light Red/Pink
        "#ABEBC6", // Light Green
        "#F5CBA7", // Light Orange
        "#D2B4DE", // Lavender
        "#FAD7A0", // Peach
        "#A9CCE3", // Sky Blue
        "#E8DAEF", // Pale Purple
        "#D4EFDF", // Mint Green
        "#FCF3CF", // Pale Yellow
        "#F5B7B1", // Salmon
        "#D6EAF8"  // Baby Blue
    ];
    
    // Return a random color from the palette
    return colorPalette[Math.floor(Math.random() * colorPalette.length)];
}

// Add this code to your existing script.js file
document.addEventListener('DOMContentLoaded', function() {
    // Get the auto color button reference (you'll add this button to your HTML)
    const autoColorBtn = document.getElementById('autoColorBtn');
    const courseColorInput = document.getElementById('courseColor');
    
    // Add event listener for the auto color button
    if (autoColorBtn) {
        autoColorBtn.addEventListener('click', function() {
            // Generate and set a random color
            const randomColor = generateRandomColor();
            courseColorInput.value = randomColor;
            
            // Optional: Show visual feedback
            autoColorBtn.style.backgroundColor = randomColor;
            setTimeout(() => {
                autoColorBtn.style.backgroundColor = '';
            }, 300);
        });
    }
});

// ENDED here

// Function to merge schedules of all sections for a specific year level
function createYearScheduleButton() {
    const sectionTabs = document.getElementById('sectionTabs');
    if (!sectionTabs) return;
    
    // Remove existing year schedule button if it exists
    const existingButton = document.getElementById('yearScheduleBtn');
    if (existingButton) existingButton.remove();
    
    // Create the new button
    const yearScheduleBtn = document.createElement('button');
    yearScheduleBtn.id = 'yearScheduleBtn';
    yearScheduleBtn.className = 'year-schedule-btn';
    yearScheduleBtn.innerHTML = '<i class="fas fa-calendar-alt"></i> Automate Schedule';
    yearScheduleBtn.addEventListener('click', () => mergeYearSchedules(currentYearTab));
    
    // Add button after section tabs
    sectionTabs.after(yearScheduleBtn);
}

// Function to merge schedules of all sections for a year level
function mergeYearSchedules(yearLevel) {
    clearSchedule();
    
    // Update header to show this is a combined view
    const scheduleTitle = document.querySelector('.schedule-container h2');
    if (scheduleTitle) {
        scheduleTitle.textContent = `Combined Schedule - Year ${yearLevel}`;
    }
    
    // Get all courses for the specified year level
    const yearCourses = [];
    
    // Get all sections for this year level
    const yearSections = sections[yearLevel] || [];
    
    // First, organize courses by section and shared courses
    const sectionSpecificCourses = {};
    const sharedCourses = [];
    
    yearSections.forEach(section => {
        sectionSpecificCourses[section] = [];
    });
    
    // Collect all courses for this year level and categorize them
    courses[yearLevel].forEach(course => {
        // Check if this course is for this year level
        if (course.yearLevel === yearLevel && yearSections.includes(course.section)) {
            // Make a deep copy of the course for scheduling
            const courseCopy = {...course};
            
            // Check if this is a shared course (appears in all sections)
            const isShared = isSharedAcrossSections(course, yearSections);
            
            if (isShared) {
                // Only add shared course once
                if (!sharedCourses.some(c => c.code === course.code)) {
                    for (let session = 1; session <= course.sessionsPerWeek; session++) {
                        const sessionCopy = {...courseCopy};
                        sessionCopy.sessionId = session;
                        sessionCopy.isShared = true;
                        sharedCourses.push(sessionCopy);
                    }
                }
            } else {
                // Add section-specific course
                if (sectionSpecificCourses[course.section]) {
                    for (let session = 1; session <= course.sessionsPerWeek; session++) {
                        const sessionCopy = {...courseCopy};
                        sessionCopy.sessionId = session;
                        sectionSpecificCourses[course.section].push(sessionCopy);
                    }
                }
            }
        }
    });
    
    // Sort courses by duration (longer courses first)
    sharedCourses.sort((a, b) => b.duration - a.duration);
    
    // First schedule shared courses (they need to be on the same time for all sections)
    const result = scheduleCoursesOptimized(sharedCourses, true);
    
    if (!result.success) {
        alert(`Could not schedule all shared courses. ${result.scheduledCount} out of ${sharedCourses.length} were scheduled.`);
    }
    
    // Then schedule section-specific courses
    let allSectionCoursesSuccessful = true;
    
    for (const section in sectionSpecificCourses) {
        const sectionCourses = sectionSpecificCourses[section];
        sectionCourses.sort((a, b) => b.duration - a.duration);
        
        const sectionResult = scheduleCoursesOptimized(sectionCourses, false);
        
        if (!sectionResult.success) {
            allSectionCoursesSuccessful = false;
        }
    }
    
    if (!allSectionCoursesSuccessful) {
        alert('Not all section-specific courses could be scheduled. The combined schedule may be incomplete.');
    } else if (result.success) {
        alert(`Combined Schedule for Year ${yearLevel} created successfully!`);
    }
}

// Check if a course is shared across all sections of a year level
function isSharedAcrossSections(course, yearSections) {
    // Check if course code appears in all sections
    const courseCode = course.code;
    const coursesByCode = {};
    
    // Count occurrences of this course code in each section
    yearSections.forEach(section => {
        coursesByCode[section] = courses[course.yearLevel].filter(c => 
            c.code === courseCode && c.section === section
        ).length;
    });
    
    // If the course appears exactly once in each section, it's a shared course
    return yearSections.every(section => coursesByCode[section] === 1);
}

// Enhanced scheduling algorithm that prevents conflicts
function scheduleCoursesOptimized(coursesToSchedule, isShared) {
    const days = [1, 2, 3, 4, 5];
    
    const timeSlots = [];
    for (let hour = 8; hour <= 16; hour++) {
        timeSlots.push(`${hour}:00`);
        if (hour < 16) {
            timeSlots.push(`${hour}:30`);
        }
    }
    // Added 16:30 as the last time slot
    timeSlots.push(`16:30`);
    
    let scheduledCount = 0;
    
    const courseSessionsByDay = {};
    const roomSchedule = {};
    const professorSchedule = {}; 
    
    for (const course of coursesToSchedule) {
        const slotsNeeded = course.duration / 30;
        
        let scheduled = false;
        
        const courseKey = `${course.code}-${course.id}`;
        if (!courseSessionsByDay[courseKey]) {
            courseSessionsByDay[courseKey] = {};
        }
        
        // Sort days to balance distribution
        const sortedDays = [...days].sort((a, b) => {
            const sessionsOnDayA = courseSessionsByDay[courseKey][a] || 0;
            const sessionsOnDayB = courseSessionsByDay[courseKey][b] || 0;
            return sessionsOnDayA - sessionsOnDayB;
        });
        
        for (const day of sortedDays) {
            if (scheduled) break;
            
            for (let startIndex = 0; startIndex < timeSlots.length - slotsNeeded + 1; startIndex++) {
                const startSlot = timeSlots[startIndex];
                
                let available = true;
                for (let i = 0; i < slotsNeeded; i++) {
                    const slotIndex = startIndex + i;
                    const currentSlot = timeSlots[slotIndex];
                    const slotKey = `${day}-${currentSlot}`;
                    const roomKey = `${course.room}-${day}-${currentSlot}`;
                    const profKey = `${course.prof}-${day}-${currentSlot}`;
                    
                    // Check for time slot conflicts with the current schedule
                    if (schedule[slotKey] && (!isShared || schedule[slotKey].code !== course.code)) {
                        available = false;
                        break;
                    }
                    
                    // Check for room conflicts if not a shared course
                    if (!isShared && roomSchedule[roomKey]) {
                        available = false;
                        break;
                    }
                    
                    // Check for professor conflicts (even shared courses need to prevent professor conflicts)
                    if (professorSchedule[profKey] && professorSchedule[profKey].code !== course.code) {
                        available = false;
                        break;
                    }
                }
                
                if (available) {
                    for (let i = 0; i < slotsNeeded; i++) {
                        const slotIndex = startIndex + i;
                        const currentSlot = timeSlots[slotIndex];
                        const slotKey = `${day}-${currentSlot}`;
                        const roomKey = `${course.room}-${day}-${currentSlot}`;
                        const profKey = `${course.prof}-${day}-${currentSlot}`;
                        
                        schedule[slotKey] = course;
                        roomSchedule[roomKey] = course;
                        professorSchedule[profKey] = course;
                    }
                    
                    courseSessionsByDay[courseKey][day] = (courseSessionsByDay[courseKey][day] || 0) + 1;
                    
                    // Add course to visual schedule with modifications to show section info
                    addCourseToYearSchedule(course, day, startSlot, slotsNeeded);
                    
                    scheduled = true;
                    scheduledCount++;
                    break;
                }
            }
        }
    }
    
    return { 
        success: scheduledCount === coursesToSchedule.length,
        scheduledCount: scheduledCount,
        totalCourses: coursesToSchedule.length
    };
}

// Function to add courses to the combined year schedule view
function addCourseToYearSchedule(course, day, startTime, slots) {
    const [hour, minute] = startTime.split(':').map(num => parseInt(num));
    
    const cell = document.querySelector(`.schedule-cell[data-day="${day}"][data-time="${startTime}"]`);
    
    if (!cell) return false;
    
    const courseElement = document.createElement('div');
    courseElement.className = 'schedule-item';
    
    // Use a different appearance for shared courses
    if (course.isShared) {
        courseElement.classList.add('shared-course');
    }
    
    courseElement.style.backgroundColor = course.color;
    courseElement.style.height = `${(course.duration / 30) * 150}%`;
    
    // Include section info in the display
    courseElement.innerHTML = `
        <div class="course-code">${course.code}</div>
        <div class="course-name">${course.name}</div>
        <div class="course-prof">${course.prof}</div>
        <div class="course-room">${course.room}</div>
        <div class="course-section">${course.isShared ? 'All Sections' : 'Section ' + course.section}</div>
    `;
    
    cell.appendChild(courseElement);
    return true;
}


// Modify existing functions to work with the new feature
function updateSectionTabs() {
    // Remove existing section tabs
    const existingSectionTabs = document.getElementById('sectionTabs');
    if (existingSectionTabs) {
        existingSectionTabs.remove();
    }
    
    // Create new section tabs
    createSectionTabs();
    
    // Add the year schedule button
    createYearScheduleButton();
}

// Add this to your initialization code
document.addEventListener('DOMContentLoaded', function() {
    // Add existing initialization...
    
    // Add styles for year schedule
    addYearScheduleStyles();
    
    // Make sure the button is created after section tabs are initialized
    setTimeout(createYearScheduleButton, 500);
});

// Add a section filter dropdown to the Year Schedule view
function addSectionFilterToYearSchedule(yearLevel) {
    // First, remove any existing filter if present
    const existingFilter = document.getElementById('sectionFilterContainer');
    if (existingFilter) {
        existingFilter.remove();
    }
    
    // Create filter container
    const filterContainer = document.createElement('div');
    filterContainer.id = 'sectionFilterContainer';
    filterContainer.className = 'section-filter-container';
    
    // Create label
    const filterLabel = document.createElement('label');
    filterLabel.textContent = 'Filter sections: ';
    filterLabel.htmlFor = 'sectionFilter';
    filterContainer.appendChild(filterLabel);
    
    // Create filter dropdown
    const filterSelect = document.createElement('select');
    filterSelect.id = 'sectionFilter';
    filterSelect.className = 'section-filter';
    
    // Add "All Sections" option
    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = 'All Sections';
    filterSelect.appendChild(allOption);
    
    // Add each section as an option
    const yearSections = sections[yearLevel] || [];
    yearSections.forEach(section => {
        const option = document.createElement('option');
        option.value = section;
        option.textContent = `Section ${section}`;
        filterSelect.appendChild(option);
    });
    
    // Add event listener to filter
    filterSelect.addEventListener('change', function() {
        filterYearScheduleBySection(this.value);
    });
    
    filterContainer.appendChild(filterSelect);
    
    // Insert the filter after the schedule title
    const scheduleTitle = document.querySelector('.schedule-container h2');
    if (scheduleTitle) {
        scheduleTitle.after(filterContainer);
    }
}

// Filter the year schedule to show only selected section
function filterYearScheduleBySection(sectionFilter) {
    // Get all scheduled courses
    const scheduledItems = document.querySelectorAll('.schedule-item');
    
    scheduledItems.forEach(item => {
        // Get the section info from the course element
        const sectionElement = item.querySelector('.course-section');
        const sectionText = sectionElement ? sectionElement.textContent : '';
        
        if (sectionFilter === 'all') {
            // Show all courses
            item.style.display = 'block';
        } else {
            // Check if this is a shared course
            if (sectionText.includes('All Sections')) {
                // Always show shared courses
                item.style.display = 'block';
            } else if (sectionText.includes(`Section ${sectionFilter}`)) {
                // Show this section's courses
                item.style.display = 'block';
            } else {
                // Hide other sections' courses
                item.style.display = 'none';
            }
        }
    });
}

// Modify the mergeYearSchedules function to add the filter
function mergeYearSchedules(yearLevel) {
    clearSchedule();
    
    // Update header to show this is a combined view
    const scheduleTitle = document.querySelector('.schedule-container h2');
    if (scheduleTitle) {
        scheduleTitle.textContent = `Combined Schedule - Year ${yearLevel}`;
    }
    
    // Get all courses for the specified year level
    const yearCourses = [];
    
    // Get all sections for this year level
    const yearSections = sections[yearLevel] || [];
    
    // First, organize courses by section and shared courses
    const sectionSpecificCourses = {};
    const sharedCourses = [];
    
    yearSections.forEach(section => {
        sectionSpecificCourses[section] = [];
    });
    
    // Collect all courses for this year level and categorize them
    courses[yearLevel].forEach(course => {
        // Check if this course is for this year level
        if (course.yearLevel === yearLevel && yearSections.includes(course.section)) {
            // Make a deep copy of the course for scheduling
            const courseCopy = {...course};
            
            // Check if this is a shared course (appears in all sections)
            const isShared = isSharedAcrossSections(course, yearSections);
            
            if (isShared) {
                // Only add shared course once
                if (!sharedCourses.some(c => c.code === course.code)) {
                    for (let session = 1; session <= course.sessionsPerWeek; session++) {
                        const sessionCopy = {...courseCopy};
                        sessionCopy.sessionId = session;
                        sessionCopy.isShared = true;
                        sharedCourses.push(sessionCopy);
                    }
                }
            } else {
                // Add section-specific course
                if (sectionSpecificCourses[course.section]) {
                    for (let session = 1; session <= course.sessionsPerWeek; session++) {
                        const sessionCopy = {...courseCopy};
                        sessionCopy.sessionId = session;
                        sectionSpecificCourses[course.section].push(sessionCopy);
                    }
                }
            }
        }
    });
    
    // Sort courses by duration (longer courses first)
    sharedCourses.sort((a, b) => b.duration - a.duration);
    
    // First schedule shared courses (they need to be on the same time for all sections)
    const result = scheduleCoursesOptimized(sharedCourses, true);
    
    if (!result.success) {
        alert(`Could not schedule all shared courses. ${result.scheduledCount} out of ${sharedCourses.length} were scheduled.`);
    }
    
    // Then schedule section-specific courses
    let allSectionCoursesSuccessful = true;
    
    for (const section in sectionSpecificCourses) {
        const sectionCourses = sectionSpecificCourses[section];
        sectionCourses.sort((a, b) => b.duration - a.duration);
        
        const sectionResult = scheduleCoursesOptimized(sectionCourses, false);
        
        if (!sectionResult.success) {
            allSectionCoursesSuccessful = false;
        }
    }
    
    if (!allSectionCoursesSuccessful) {
        alert('Not all section-specific courses could be scheduled. The combined schedule may be incomplete.');
    } else if (result.success) {
        alert(`Combined Schedule for Year ${yearLevel} created successfully!`);
    }
    
    // Add section filter after scheduling
    addSectionFilterToYearSchedule(yearLevel);
}

// Add CSS for the section filter
function addYearScheduleStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
        .year-schedule-btn {
            background-color: #ffc107;
            color: #333;
            border: none;
            padding: 8px 15px;
            border-radius: 5px;
            cursor: pointer;
            margin-left: 10px;
            margin-bottom: 15px;
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 5px;
            transition: all 0.3s;
        }
        
        .year-schedule-btn:hover {
            background-color: #e0a800;
        }
        
        .shared-course {
            border: 2px dashed #fff;
        }
        
        .shared-course .course-section {
            font-weight: bold;
            font-style: normal !important;
        }
        
        .section-filter-container {
            margin: 10px 0 15px 0;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .section-filter {
            padding: 6px 10px;
            border-radius: 4px;
            border: 1px solid #ccc;
            background-color: #fff;
            font-size: 14px;
        }
    `;
    document.head.appendChild(style);
}

