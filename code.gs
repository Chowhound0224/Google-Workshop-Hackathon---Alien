function doGet(e) {
  var page = e.parameter.page || 'login';
  if (page == 'employee') {
    return HtmlService.createHtmlOutputFromFile('Employee.html');
  } else if (page == 'admin') {
    return HtmlService.createHtmlOutputFromFile('admin.html');
  } else {
    return HtmlService.createHtmlOutputFromFile('loginpage.html');
  }
}

function getScriptUrl() {
  return ScriptApp.getService().getUrl();
}

function loginEmployee(employeeId, password) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('EmployeeData');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == employeeId && data[i][10] == password) {
      return { success: true, isAdmin: data[i][11] == 'admin', employeeId: employeeId };
    }
  }


  return { success: false };
}

function getEmployeeDetails(employeeId) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('EmployeeData');
  var data = sheet.getDataRange().getValues();
 
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == employeeId) {
      return {
        employeeId: data[i][0],
        name: data[i][1],
        age: data[i][3],
        email: data[i][7],
        phone: data[i][9]
      };
    }
  }
  throw new Error('Employee not found');
}

function updateEmployee(employee) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('EmployeeData');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == employee.employeeId) {
      data[i][1] = employee.name;
      data[i][3] = employee.age;
      data[i][7] = employee.email;
      data[i][9] = employee.phone;
      sheet.getRange(i + 1, 1, 1, 7).setValues([data[i]]);
      return;
    }
  }
}

function deleteEmployee(employeeId) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('EmployeeData');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == employeeId) {
      sheet.deleteRow(i + 1);
      return;
    }
  }
}

function getEmployees() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('EmployeeData');
  var data = sheet.getDataRange().getValues();
  var employees = [];
  for (var i = 1; i < data.length; i++) {
    employees.push({
      id: data[i][0],
      name: data[i][1],
      age: data[i][3],
      email: data[i][7],
      phone: data[i][9]
    });
  }
  return employees;
}

function addEmployee(employee) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('EmployeeData');
  sheet.appendRow([employee.id, employee.name, employee.age, employee.email, employee.phone]);
}

function getLeaveApplications() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('LeaveApplications');
  var data = sheet.getDataRange().getValues();
  var applications = [];
  for (var i = 1; i < data.length; i++) {
    applications.push({
      id: data[i][0],
      startDate: formatDate(data[i][1]),
      endDate: formatDate(data[i][2]),
      reason: data[i][3],
      status: data[i][4]
    });
  }
  return applications;
}

function updateLeaveStatus(leaveId, status) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('LeaveApplications');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == leaveId) {
      data[i][4] = status;
      sheet.getRange(i + 1, 1, 1, 6).setValues([data[i]]);
      return;
    }
  }
}
function checkIn(employeeId, latitude, longitude) {
  const timestamp = new Date();
  const isLate = checkIfLate(timestamp);
  const checkInDate = formatDate(timestamp);
  const checkInTime = formatTime(timestamp);

  const attendanceRecord = {
    employeeId,
    checkInDate,
    checkInTime,
    isLate
  };

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Attendance');
  const data = sheet.getDataRange().getValues();

  // Check if the employee has already checked in today
  const alreadyCheckedIn = data.some(row => row[0] === employeeId && row[2] === checkInDate);

  if (alreadyCheckedIn) {
    throw new Error('You have already checked in today.');
  }

  sheet.appendRow([employeeId, '', checkInDate, checkInTime, isLate ? 'Yes' : 'No', '', '', '']);

  return attendanceRecord;
}


function checkOut(employeeId, latitude, longitude, isEarlyLeave) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Attendance');
  var date = new Date();
  const checkOutDate = formatDate(date);
  const checkOutTime = formatTime(date);
  var row = findRow(sheet, employeeId, date);

  if (row) {
    sheet.getRange(row, 6).setValue(checkOutDate); 
    sheet.getRange(row,7).setValue(checkOutTime)
    sheet.getRange(row, 8).setValue(isEarlyLeave); 
  } else {
    throw new Error('Check-In record not found for today.');
  }
}

function findRow(sheet, employeeId, date) {
  const checkOutDate = formatDate(date);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === employeeId && data[i][2] === checkOutDate && data[i][5] === null) { 
      return i + 1;
    }
  }
  return null;
}

function getAttendanceRecords(employeeId) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Attendance');
  if (!sheet) {
    Logger.log("Attendance sheet not found");
    return [];
  }

  var data = sheet.getDataRange().getValues();
  if (data.length < 2) {  // Check if there's data beyond the header row
    Logger.log("No data found in the sheet");
    return [];
  }

  var records = [];

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == employeeId) {
      records.push({
        date: formatDate(data[i][2]),
        checkInTime: formatTime(data[i][3]),
        late: data[i][4] === 'Yes',
        checkOutDate: formatDate(data[i][5]),
        checkOutTime: formatTime(data[i][6]),
        earlyLeave: data[i][7] === 'Yes'
      });
    }
  }
  
  Logger.log("Records to return: " + JSON.stringify(records));
  return records;
}

function getDashboardStats(employeeId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Attendance');
  const data = sheet.getDataRange().getValues();
  const records = data.filter(row => row[0] === employeeId);

  const totalWorkingDays = new Set(records.map(record => record[2])).size; 
  const totalDaysLate = records.filter(record => record[4] === 'Yes').length;
  const totalDaysEarly = records.filter(record => record[7] === 'Yes').length;

  return {
    totalWorkingDays,
    totalDaysLate,
    totalDaysEarly
  };
}

function checkIfLate(timestamp) {
  const checkInTime = new Date(timestamp);
  checkInTime.setHours(9, 0, 0, 0); // 9:00 AM
  return timestamp > checkInTime;
}

function checkIfEarlyLeave(timestamp) {
  const checkOutTime = new Date(timestamp);
  checkOutTime.setHours(17, 0, 0, 0); // 5:00 PM
  return timestamp < checkOutTime;
}

function formatDate(dateString) {
if (typeof dateString === 'string') {
    // If it's already a string, return it as is
    return dateString;
  } else if (dateString instanceof Date) {
    // If it's a Date object, format it
    return Utilities.formatDate(dateString, Session.getScriptTimeZone(), 'MM/dd/yyyy');
  } else {
    // If it's neither a string nor a Date, return an error message
    return 'Invalid Date';
  }
}

function formatTime(timeString) {
  if (typeof timeString === 'string') {
    // If it's already a string, return it as is
    return timeString;
  } else if (timeString instanceof Date) {
    // If it's a Date object, format it
    return Utilities.formatDate(timeString, Session.getScriptTimeZone(), 'HH:mm:ss');
  } else {
    // If it's neither a string nor a Date, return an error message
    return 'Invalid Time';
  }
}

function applyLeave(leaveData) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('LeaveApplications');
  sheet.appendRow([
    leaveData.employeeId, // Use employeeId instead of id
    leaveData.startDate,
    leaveData.endDate,
    leaveData.reason,
    "Pending"
  ]);
}

function submitExpense(expenseData) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ExpenseClaims');
  
  // Decode the base64 file data
  var blob = Utilities.newBlob(Utilities.base64Decode(expenseData.receipt), expenseData.mimeType, expenseData.filename);

  // Save the file to Google Drive
  var folder = DriveApp.getFolderById('1F0QhoGEI1sgST9gIOzDtAOGE9XgD-UlF'); 
  var file = folder.createFile(blob);

  // Append the expense data to the sheet
  sheet.appendRow([
    expenseData.employeeId,
    expenseData.date,
    expenseData.amount,
    expenseData.description,
    expenseData.type,
    file.getUrl(), // Save the file URL
    "Pending"
  ]);
}

function getExpenseClaims() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ExpenseClaims');
  var data = sheet.getDataRange().getValues();
  var claims = [];
  for (var i = 1; i < data.length; i++) {
    claims.push({
      id: i,
      employeeId: data[i][0],
      date: data[i][1],
      amount: data[i][2],
      description: data[i][3],
      type: data[i][4], // Get expense type
      fileUrl: data[i][5], // Get file URL
      status: data[i][6]
    });
  }
  return claims;
}


function updateExpenseStatus(claimId, status) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ExpenseClaims');
  sheet.getRange(claimId + 1, 5).setValue(status); 
}
