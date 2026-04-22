// ============================================================
// 공터 영어 학원 - Google Apps Script
// 이 파일을 Google Sheets > 확장 프로그램 > Apps Script에 붙여넣기
// 스프레드시트 ID: 1Wc0oZYvfR0lFJyX1LWtGzaMSVW3MwhGIp7DsaOQv_lQ
// ============================================================

const SPREADSHEET_ID = '1Wc0oZYvfR0lFJyX1LWtGzaMSVW3MwhGIp7DsaOQv_lQ';

function getOrCreateSheet(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function initSheets() {
  // 출석 시트
  const att = getOrCreateSheet('출석기록');
  if (att.getLastRow() === 0) {
    att.appendRow(['날짜', '학생명', '반', '입실시간', '상태', '기록시간']);
    att.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#4a86e8').setFontColor('white');
  }
  // 숙제 시트
  const hw = getOrCreateSheet('숙제기록');
  if (hw.getLastRow() === 0) {
    hw.appendRow(['주차', '요일', '학생명', '컴퓨터', '교재', '단어', '기타', '상태', '제출일시', '승인일시']);
    hw.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground('#6aa84f').setFontColor('white');
  }
  // 시험 시트
  const test = getOrCreateSheet('시험기록');
  if (test.getLastRow() === 0) {
    test.appendRow(['주차', '날짜', '학생명', '과목', '점수', '만점', '달성률', '상태', '기록시간']);
    test.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#e69138').setFontColor('white');
  }
  // 달러 시트
  const dollar = getOrCreateSheet('달러기록');
  if (dollar.getLastRow() === 0) {
    dollar.appendRow(['날짜', '학생명', '변동금액', '사유', '잔액', '기록시간']);
    dollar.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#8e7cc3').setFontColor('white');
  }
  return ContentService.createTextOutput(JSON.stringify({ status: 'initialized' })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const type = data.type;
    
    if (type === 'attendance') return saveAttendance(data);
    if (type === 'homework') return saveHomework(data);
    if (type === 'test') return saveTest(data);
    if (type === 'dollar') return saveDollar(data);
    if (type === 'init') return initSheets();
    
    return ContentService.createTextOutput(JSON.stringify({ error: 'Unknown type' })).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return initSheets();
}

function saveAttendance(data) {
  const sheet = getOrCreateSheet('출석기록');
  sheet.appendRow([
    data.date, data.studentName, data.classGroup,
    data.checkInTime, data.status === 'present' ? '출석' : data.status === 'late' ? '지각' : '결석',
    new Date().toLocaleString('ko-KR')
  ]);
  return ContentService.createTextOutput(JSON.stringify({ status: 'ok' })).setMimeType(ContentService.MimeType.JSON);
}

function saveHomework(data) {
  const sheet = getOrCreateSheet('숙제기록');
  const dayMap = { mon:'월', tue:'화', wed:'수', thu:'목', fri:'금' };
  sheet.appendRow([
    data.week, dayMap[data.day] || data.day, data.studentName,
    data.computer || '', data.textbook || '', data.vocabulary || '', data.other || '',
    data.status === 'approved' ? '승인' : data.status === 'pending' ? '대기' : '반려',
    data.submittedAt, data.approvedAt || ''
  ]);
  return ContentService.createTextOutput(JSON.stringify({ status: 'ok' })).setMimeType(ContentService.MimeType.JSON);
}

function saveTest(data) {
  const sheet = getOrCreateSheet('시험기록');
  const pct = data.score !== null ? Math.round((data.score / data.maxScore) * 100) + '%' : '-';
  sheet.appendRow([
    data.week, data.date, data.studentName, data.subject,
    data.score !== null ? data.score : '-', data.maxScore, pct,
    data.status === 'confirmed' ? '확정' : '대기',
    new Date().toLocaleString('ko-KR')
  ]);
  return ContentService.createTextOutput(JSON.stringify({ status: 'ok' })).setMimeType(ContentService.MimeType.JSON);
}

function saveDollar(data) {
  const sheet = getOrCreateSheet('달러기록');
  sheet.appendRow([
    new Date().toLocaleDateString('ko-KR'), data.studentName,
    data.amount > 0 ? '+' + data.amount : data.amount,
    data.reason || '주간 달러 지급', data.newBalance,
    new Date().toLocaleString('ko-KR')
  ]);
  return ContentService.createTextOutput(JSON.stringify({ status: 'ok' })).setMimeType(ContentService.MimeType.JSON);
}
