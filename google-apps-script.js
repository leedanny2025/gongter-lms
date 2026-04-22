// ================================================================
// 공터 영어 학원 학습 관리 시스템 - Google Apps Script
// ================================================================
// 설치 방법:
// 1. https://docs.google.com/spreadsheets/d/1Wc0oZYvfR0lFJyX1LWtGzaMSVW3MwhGIp7DsaOQv_lQ 열기
// 2. 확장 프로그램 > Apps Script
// 3. 이 코드 전체 붙여넣기 (기존 코드 삭제 후)
// 4. 저장 (Ctrl+S)
// 5. 배포 > 새 배포 > 유형: 웹 앱
//    - 설명: 공터LMS
//    - 실행 계정: 나
//    - 액세스 권한: 모든 사용자 (익명 포함)
// 6. 배포 클릭 > 권한 허용 > 웹 앱 URL 복사
// 7. 복사한 URL을 Vercel 환경변수 NEXT_PUBLIC_SHEETS_URL 에 설정
// ================================================================

const SS_ID = '1Wc0oZYvfR0lFJyX1LWtGzaMSVW3MwhGIp7DsaOQv_lQ';
const KST = 'Asia/Seoul';

function getSheet(name, headers) {
  const ss = SpreadsheetApp.openById(SS_ID);
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headers) {
      const r = sheet.getRange(1, 1, 1, headers.length);
      r.setValues([headers]).setFontWeight('bold').setFontColor('white').setWrap(true);
      const colors = {
        '출석기록':'#1a73e8','숙제기록':'#34a853','시험기록':'#fbbc04',
        '달러기록':'#9334e6','학생목록':'#ea4335'
      };
      r.setBackground(colors[name] || '#333');
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

function doGet(e) {
  const action = e && e.parameter ? (e.parameter.action || '') : '';
  if (action === 'init') return initAll();
  if (action === 'ping') return ok('pong');
  return ok('공터 LMS API 정상 동작');
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    switch (data.type) {
      case 'attendance': return saveAttendance(data);
      case 'homework':   return saveHomework(data);
      case 'test':       return saveTest(data);
      case 'dollar':     return saveDollar(data);
      case 'student':    return saveStudent(data);
      case 'init':       return initAll();
      default:           return err('알 수 없는 type: ' + data.type);
    }
  } catch(ex) {
    return err(ex.toString());
  }
}

function initAll() {
  getSheet('출석기록', ['날짜','학생명','반','입실시간','상태','기록시간']);
  getSheet('숙제기록', ['주차','요일','학생명','컴퓨터','교재','단어','기타','상태','제출일시','승인일시']);
  getSheet('시험기록', ['주차','날짜','학생명','과목','점수','만점','달성률','상태','기록시간']);
  getSheet('달러기록', ['날짜','학생명','변동금액','사유','잔액','기록시간']);
  getSheet('학생목록', ['학생ID','이름','학년','반','보유달러','비밀번호','등록일']);
  return ok('시트 초기화 완료');
}

function saveAttendance(d) {
  const sheet = getSheet('출석기록', ['날짜','학생명','반','입실시간','상태','기록시간']);
  const statusLabel = d.status === 'present' ? '출석' : d.status === 'late' ? '지각' : '결석';
  sheet.appendRow([
    d.date, d.studentName, d.classGroup || '',
    d.checkInTime, statusLabel,
    Utilities.formatDate(new Date(), KST, 'yyyy-MM-dd HH:mm:ss')
  ]);
  return ok('출석 기록 완료');
}

function saveHomework(d) {
  const sheet = getSheet('숙제기록', ['주차','요일','학생명','컴퓨터','교재','단어','기타','상태','제출일시','승인일시']);
  const dayMap = {mon:'월',tue:'화',wed:'수',thu:'목',fri:'금'};
  const statusLabel = d.status === 'approved' ? '승인' : d.status === 'pending' ? '대기' : '반려';
  sheet.appendRow([
    d.week, dayMap[d.day]||d.day, d.studentName,
    d.computer||'', d.textbook||'', d.vocabulary||'', d.other||'',
    statusLabel, d.submittedAt||'', d.approvedAt||''
  ]);
  return ok('숙제 기록 완료');
}

function saveTest(d) {
  const sheet = getSheet('시험기록', ['주차','날짜','학생명','과목','점수','만점','달성률','상태','기록시간']);
  const pct = (d.score !== null && d.score !== undefined && d.score !== '-')
    ? Math.round((Number(d.score) / Number(d.maxScore)) * 100) + '%' : '-';
  sheet.appendRow([
    d.week, d.date, d.studentName, d.subject,
    d.score !== null && d.score !== undefined ? d.score : '-',
    d.maxScore, pct,
    d.status === 'confirmed' ? '확정' : '대기',
    Utilities.formatDate(new Date(), KST, 'yyyy-MM-dd HH:mm:ss')
  ]);
  return ok('시험 기록 완료');
}

function saveDollar(d) {
  const sheet = getSheet('달러기록', ['날짜','학생명','변동금액','사유','잔액','기록시간']);
  sheet.appendRow([
    Utilities.formatDate(new Date(), KST, 'yyyy-MM-dd'),
    d.studentName,
    Number(d.amount) > 0 ? '+' + d.amount : String(d.amount),
    d.reason || '주간 달러 지급',
    d.newBalance,
    Utilities.formatDate(new Date(), KST, 'yyyy-MM-dd HH:mm:ss')
  ]);
  return ok('달러 기록 완료');
}

function saveStudent(d) {
  const sheet = getSheet('학생목록', ['학생ID','이름','학년','반','보유달러','비밀번호','등록일']);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(d.id)) {
      sheet.getRange(i+1, 1, 1, 7).setValues([[
        d.id, d.name, d.grade, d.classGroup||'',
        d.dollars||0, d.pin||'1111', d.joinedAt||''
      ]]);
      return ok('학생 업데이트');
    }
  }
  sheet.appendRow([d.id, d.name, d.grade, d.classGroup||'', d.dollars||0, d.pin||'1111', d.joinedAt||'']);
  return ok('학생 추가');
}

function ok(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({status:'ok', message:msg}))
    .setMimeType(ContentService.MimeType.JSON);
}
function err(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({status:'error', message:msg}))
    .setMimeType(ContentService.MimeType.JSON);
}
