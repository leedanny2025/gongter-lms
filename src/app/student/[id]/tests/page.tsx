'use client';

import { useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { TestRecord } from '@/lib/types';
import { Camera, Upload, CheckCircle, Clock, ImageIcon, X, Loader2, ClipboardCheck, AlertCircle } from 'lucide-react';
import { localDateStr, getWeekKey, DAY_LABELS, DAY_ORDER } from '@/lib/utils';

type SubmitStep = 'form' | 'photo' | 'extracting' | 'confirm' | 'done';

export default function StudentTestPage() {
  const params = useParams();
  const id = params.id as string;
  const { state, dispatch } = useStore();

  const student = state.students.find(s => s.id === id);
  const week = getWeekKey();
  const myTests = state.testRecords.filter(t => t.studentId === id);
  const latestTest = myTests[myTests.length - 1];

  const [step, setStep] = useState<SubmitStep>('form');
  const [subject, setSubject] = useState('영어 어휘 테스트');
  const [maxScore, setMaxScore] = useState(20);
  const [score, setScore] = useState('');
  const [selectedDay, setSelectedDay] = useState<string>(DAY_ORDER[new Date().getDay() - 1] || 'mon');
  const [extractedScore, setExtractedScore] = useState<number | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [inputMethod, setInputMethod] = useState<'direct' | 'photo'>('direct');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhoto = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      setImagePreview(e.target?.result as string);
      setStep('extracting');
      // OCR 시뮬레이션 (실제 구현 시 Google Vision API 또는 Tesseract 사용)
      setTimeout(() => {
        const mockScore = Math.floor(Math.random() * 30) + 70; // 70~99점 시뮬레이션
        setExtractedScore(mockScore);
        setScore(mockScore.toString());
        setStep('confirm');
      }, 2200);
    };
    reader.readAsDataURL(file);
  };

  const submit = () => {
    const finalScore = score ? Number(score) : null;
    const record: TestRecord = {
      id: `t${Date.now()}`,
      studentId: id,
      studentName: student?.name || '',
      subject,
      score: finalScore,
      maxScore: maxScore,
      imageUrl: imagePreview || undefined,
      submittedByStudent: true,
      status: 'pending',
      week,
      date: localDateStr(),
      day: selectedDay,
    };
    dispatch({ type: 'ADD_TEST', payload: record });
    setStep('done');
  };

  const reset = () => {
    setStep('form');
    setScore('');
    setExtractedScore(null);
    setImagePreview(null);
    setInputMethod('direct');
    setSelectedDay(DAY_ORDER[new Date().getDay() - 1] || 'mon');
  };

  const gradeColor = (pct: number) => pct >= 80 ? '#16a34a' : pct >= 60 ? '#d97706' : '#dc2626';
  const gradeLabel = (pct: number) => pct >= 90 ? 'A' : pct >= 80 ? 'B' : pct >= 70 ? 'C' : pct >= 60 ? 'D' : 'F';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 이번 주 상태 */}
      {latestTest && step === 'form' && (
        <div style={{
          background: 'white', borderRadius: 20, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            {latestTest.status === 'confirmed' ? <CheckCircle size={20} color="#16a34a" /> : <Clock size={20} color="#d97706" />}
            <span style={{ fontWeight: 700, fontSize: 15, color: latestTest.status === 'confirmed' ? '#15803d' : '#92400e' }}>
              {latestTest.status === 'confirmed' ? '점수 확정 완료!' : '선생님 확인 중...'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#f8fafc', borderRadius: 12, padding: '12px 16px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: latestTest.score !== null ? gradeColor((latestTest.score / latestTest.maxScore) * 100) : '#94a3b8' }}>
                {latestTest.score !== null ? `${latestTest.score}개` : '-'}
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>/ {latestTest.maxScore}개 맞음</div>
            </div>
            {latestTest.score !== null && (
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>달성률</div>
                <div style={{ background: '#e2e8f0', borderRadius: 6, height: 10, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(latestTest.score / latestTest.maxScore) * 100}%`, background: gradeColor((latestTest.score / latestTest.maxScore) * 100), borderRadius: 6 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 12 }}>
                  <span style={{ color: '#64748b' }}>{Math.round((latestTest.score / latestTest.maxScore) * 100)}%</span>
                  <span style={{ fontWeight: 700, color: gradeColor((latestTest.score / latestTest.maxScore) * 100) }}>등급 {gradeLabel((latestTest.score / latestTest.maxScore) * 100)}</span>
                </div>
              </div>
            )}
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 10 }}>{latestTest.subject} · {latestTest.date}</div>
        </div>
      )}

      {/* 메인 입력 폼 */}
      <div style={{ background: 'white', borderRadius: 20, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ background: '#fef3c7', borderRadius: 10, padding: 8 }}>
            <ClipboardCheck size={20} color="#f59e0b" />
          </div>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>시험 점수 제출</h2>
        </div>

        {/* STEP: form */}
        {step === 'form' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>요일</label>
              <div style={{ display: 'flex', gap: 4 }}>
                {DAY_ORDER.map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 8, border: '1px solid',
                      borderColor: selectedDay === day ? '#6366f1' : '#e2e8f0',
                      background: selectedDay === day ? '#eff0ff' : 'white',
                      color: selectedDay === day ? '#6366f1' : '#94a3b8',
                      fontWeight: selectedDay === day ? 700 : 400, fontSize: 13, cursor: 'pointer',
                      minHeight: 'unset',
                    }}
                  >
                    {DAY_LABELS[day]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>과목</label>
              <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="시험명" style={{ borderRadius: 8, fontSize: 14, padding: '8px 10px' }} />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>입력</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button onClick={() => setInputMethod('direct')} style={{
                  padding: 12, borderRadius: 10, border: '1.5px solid',
                  borderColor: inputMethod === 'direct' ? '#6366f1' : '#e2e8f0',
                  background: inputMethod === 'direct' ? '#eff0ff' : '#f8fafc',
                  cursor: 'pointer', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>✏️</div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: inputMethod === 'direct' ? '#4338ca' : '#374151' }}>직접</div>
                </button>
                <button onClick={() => setInputMethod('photo')} style={{
                  padding: 12, borderRadius: 10, border: '1.5px solid',
                  borderColor: inputMethod === 'photo' ? '#6366f1' : '#e2e8f0',
                  background: inputMethod === 'photo' ? '#eff0ff' : '#f8fafc',
                  cursor: 'pointer', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>📸</div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: inputMethod === 'photo' ? '#4338ca' : '#374151' }}>사진</div>
                </button>
              </div>
            </div>

            {inputMethod === 'direct' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>점수</label>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input
                      type="number" value={score} onChange={e => setScore(e.target.value)}
                      placeholder="0"
                      style={{ fontSize: 24, fontWeight: 800, textAlign: 'center', flex: 1, borderRadius: 10, padding: '8px' }}
                      min="0" max={maxScore}
                    />
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#94a3b8' }}>/</div>
                    <input
                      type="number"
                      value={maxScore}
                      onChange={e => setMaxScore(Math.max(1, Number(e.target.value) || 20))}
                      placeholder="20"
                      style={{ fontSize: 24, fontWeight: 800, textAlign: 'center', width: 70, borderRadius: 10, border: '1.5px solid #6366f1', padding: '8px 6px', background: 'white', cursor: 'text', pointerEvents: 'auto' }}
                      min="1"
                    />
                  </div>
                  {score && (
                    <div style={{ marginTop: 8, textAlign: 'center', padding: '8px', background: '#f8fafc', borderRadius: 8, fontSize: 13, fontWeight: 700, color: gradeColor((Number(score) / maxScore) * 100) }}>
                      {Math.round((Number(score) / maxScore) * 100)}% · {gradeLabel((Number(score) / maxScore) * 100)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {inputMethod === 'photo' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>만점 점수</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="number"
                      value={maxScore}
                      onChange={e => setMaxScore(Math.max(1, Number(e.target.value) || 20))}
                      placeholder="20"
                      style={{ fontSize: 18, fontWeight: 700, textAlign: 'center', flex: 1, borderRadius: 12, border: '2px solid #6366f1', padding: '12px 14px', background: 'white', cursor: 'text', pointerEvents: 'auto' }}
                      min="1"
                    />
                    <span style={{ fontSize: 16, fontWeight: 600, color: '#94a3b8', whiteSpace: 'nowrap' }}>개</span>
                  </div>
                </div>
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    capture="environment"
                    style={{ display: 'none' }}
                    onChange={e => e.target.files?.[0] && handlePhoto(e.target.files[0])}
                  />
                  <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed #6366f1', borderRadius: 14, padding: 32, textAlign: 'center',
                    cursor: 'pointer', background: '#f5f3ff',
                  }}
                >
                  <Camera size={40} color="#6366f1" style={{ display: 'block', margin: '0 auto 12px' }} />
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#4338ca', marginBottom: 6 }}>시험지 사진 찍기</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>카메라로 찍거나 갤러리에서 선택하세요</div>
                  <div style={{ fontSize: 11, color: '#a5b4fc', marginTop: 6 }}>📸 점수가 자동으로 인식됩니다</div>
                </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button onClick={() => fileInputRef.current?.click()} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1px solid #6366f1', background: 'white', color: '#6366f1', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <Camera size={16} /> 카메라
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#374151', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <Upload size={16} /> 갤러리
                    </button>
                  </div>
                </div>
              </div>
            )}

            {(inputMethod === 'direct' && score) && (
              <button onClick={submit} style={{
                width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                <CheckCircle size={18} /> 점수 제출하기
              </button>
            )}
          </div>
        )}

        {/* STEP: extracting (OCR 처리중) */}
        {step === 'extracting' && (
          <div style={{ textAlign: 'center', padding: '30px 20px' }}>
            {imagePreview && (
              <div style={{ marginBottom: 20 }}>
                <img src={imagePreview} alt="시험지" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 12, objectFit: 'contain', border: '2px solid #e2e8f0' }} />
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 56, height: 56, background: '#eff0ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 size={28} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>점수 인식 중...</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>시험지에서 점수를 자동으로 읽어오고 있어요</div>
            </div>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* STEP: confirm (OCR 결과 확인) */}
        {step === 'confirm' && (
          <div>
            {imagePreview && (
              <div style={{ marginBottom: 16, position: 'relative' }}>
                <img src={imagePreview} alt="시험지" style={{ width: '100%', maxHeight: 200, borderRadius: 12, objectFit: 'contain', border: '2px solid #e2e8f0', background: '#f8fafc' }} />
                <div style={{ position: 'absolute', top: 8, right: 8 }}>
                  <span style={{ background: '#22c55e', color: 'white', fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 700 }}>점수 인식 완료</span>
                </div>
              </div>
            )}

            <div style={{ background: '#f0fdf4', borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>인식된 점수</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 48, fontWeight: 900, color: gradeColor((extractedScore! / maxScore) * 100), lineHeight: 1 }}>
                    {extractedScore}
                  </div>
                </div>
                <div style={{ fontSize: 24, color: '#94a3b8' }}>/</div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <input
                    type="number"
                    value={maxScore}
                    onChange={e => setMaxScore(Math.max(1, Number(e.target.value) || 20))}
                    style={{ fontSize: 20, fontWeight: 700, textAlign: 'center', width: 80, borderRadius: 10, border: '2px solid #86efac', padding: '8px 10px', background: 'white', cursor: 'text', pointerEvents: 'auto' }}
                    min="1"
                  />
                  <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>개</span>
                </div>
              </div>
              {extractedScore !== null && (
                <div style={{ marginTop: 12, textAlign: 'center', padding: '8px', background: 'white', borderRadius: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: gradeColor((extractedScore / maxScore) * 100) }}>
                    {Math.round((extractedScore / maxScore) * 100)}% · 등급 {gradeLabel((extractedScore / maxScore) * 100)}
                  </span>
                </div>
              )}
            </div>

            <div style={{ background: '#fffbeb', borderRadius: 10, padding: 12, marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
              <AlertCircle size={16} color="#d97706" />
              <span style={{ fontSize: 13, color: '#92400e' }}>인식이 정확하지 않을 수 있어요. 아래에서 직접 수정하세요.</span>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>점수 수정 (필요시)</label>
              <input
                type="number" value={score}
                onChange={e => setScore(e.target.value)}
                style={{ fontSize: 28, fontWeight: 800, textAlign: 'center', borderRadius: 12 }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={reset} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', color: '#374151', cursor: 'pointer', fontWeight: 600 }}>
                다시 찍기
              </button>
              <button onClick={submit} style={{ flex: 2, padding: '12px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <CheckCircle size={16} /> 이 점수로 제출
              </button>
            </div>
          </div>
        )}

        {/* STEP: done */}
        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ width: 72, height: 72, background: '#d1fae5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle size={36} color="#16a34a" />
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>제출 완료!</div>
            <div style={{ fontSize: 14, color: '#64748b', marginBottom: 24, lineHeight: 1.6 }}>
              선생님이 점수를 확인하고 최종 확정해 드릴게요.<br />확정되면 달러를 받을 수 있어요 🎉
            </div>
            <button onClick={reset} style={{ padding: '12px 28px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
              새 점수 제출
            </button>
          </div>
        )}
      </div>

      {/* 시험 기록 */}
      {myTests.length > 0 && step !== 'done' && (
        <div style={{ background: 'white', borderRadius: 20, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>내 시험 기록</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...myTests].reverse().map(t => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{t.subject}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{t.date}</div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 10 }}>
                  {t.score !== null ? (
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: gradeColor((t.score / t.maxScore) * 100) }}>{t.score}개</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{Math.round((t.score / t.maxScore) * 100)}%</div>
                    </div>
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: 14 }}>미확정</span>
                  )}
                  <span className={`badge badge-${t.status}`} style={{ fontSize: 11 }}>
                    {t.status === 'confirmed' ? '확정' : '대기'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
