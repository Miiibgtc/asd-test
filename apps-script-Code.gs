/* قبل النشر: القيم التالية مُعدّة مسبقاً */
const ADMIN_EMAIL = "qwerty12321yyyy@gmail.com";
const ADMIN_PASSWORD = "sara2007"; // كلمة السر للوحة إدارة الموقع
const SHEET_NAME = "Results"; // اسم الورقة داخل الـ Spreadsheet

function doPost(e){
  try {
    // تحمّل payload بأمان من أنواع POST مختلفة
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch(parseErr) {
        payload = { raw: e.postData.contents };
      }
    } else if (e && e.parameter && e.parameter.data) {
      try { payload = JSON.parse(e.parameter.data); } catch(err){ payload = e.parameter; }
    } else if (e && Object.keys(e || {}).length > 0) {
      payload = {};
      if (e.parameter) {
        for (let k in e.parameter) payload[k] = e.parameter[k];
      }
    } else {
      throw new Error("لا يوجد حدث POST صالح. لا تشغلي doPost يدوياً من المحرر، أرسلي POST من موقعك.");
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Timestamp","Name","Age","Phone","Percentage","Answers","RawData"]);
    }

    const row = [
      payload.timestamp || new Date().toISOString(),
      payload.name || "",
      payload.age || "",
      payload.phone || "",
      payload.percentage || "",
      JSON.stringify(payload.answers || {}),
      JSON.stringify(payload)
    ];
    sheet.appendRow(row);

    // إرسال إشعار بالبريد إلى ADMIN_EMAIL
    const subject = "نتيجة اختبار جديدة";
    const body = "وصلت نتيجة اختبار جديدة:\n\n" +
                 "الاسم: " + row[1] + "\n" +
                 "العمر: " + row[2] + "\n" +
                 "الهاتف: " + row[3] + "\n" +
                 "النسبة: " + row[4] + "%\n\n" +
                 "للاطلاع على كامل التفاصيل، افتح جدول النتائج في Google Sheets.";
    MailApp.sendEmail(ADMIN_EMAIL, subject, body);

    return ContentService.createTextOutput("OK").setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    return ContentService.createTextOutput("ERROR: " + err.toString());
  }
}

function doGet(e){
  const action = e.parameter && e.parameter.action;
  const pass = e.parameter && e.parameter.password;
  if (action === "admin") {
    if (pass !== ADMIN_PASSWORD) {
      return ContentService.createTextOutput(JSON.stringify({error:"unauthorized"})).setMimeType(ContentService.MimeType.JSON);
    }
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
    const rows = sheet.getDataRange().getValues();
    const results = [];
    for (let i = 1; i < rows.length; i++){
      const r = rows[i];
      results.push({
        timestamp: r[0], name: r[1], age: r[2], phone: r[3], percentage: r[4], answers: tryParseJSON(r[5]) || {}
      });
    }
    return ContentService.createTextOutput(JSON.stringify(results)).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput("Ready");
}

function tryParseJSON(s){
  try { return JSON.parse(s); } catch(e){ return null; }
}
