<template>
  <div class="app-container">
    <!-- 헤더 영역 -->
    <header>
      <div class="logo-section">
        <div class="logo-title-group">
          <h1><span>Overfit Checker</span> 🔍</h1>
          <div class="meta-badges">
            <span class="version-badge">{{ appVersion }}</span>
            <span class="label-badge">{{ appLabel }}</span>
          </div>
        </div>
        <p>설계 문서와 계획서의 오버엔지니어링 여부를 판독합니다.</p>
      </div>
      <button class="theme-toggle-btn" @click="toggleTheme">
        <span v-if="isDark">☀️ Light Mode</span>
        <span v-else>🌙 Dark Mode</span>
      </button>
    </header>

    <!-- 메인 콘텐츠 영역 -->
    <main class="split-layout">
      <!-- Left Column: 입력 폼 및 히스토리 -->
      <div class="left-column">
        <!-- 입력 폼 -->
        <section class="card input-section">
          <h2>📝 마크다운 설계 문서 입력</h2>
          <div class="textarea-container">
            <textarea
              v-model="markdownText"
              placeholder="# 설계 계획안을 여기에 붙여넣으세요...&#10;&#10;예: Kafka, Cassandra, Kubernetes를 사용한 실시간 댓글 알림 서비스 설계 등"
              :disabled="isLoading"
            ></textarea>
          </div>
          <div style="display: flex; gap: 0.75rem; margin-bottom: 1.25rem;">
            <button
              type="button"
              class="theme-toggle-btn"
              style="flex: 1; justify-content: center;"
              @click="loadSample('aegis')"
              :disabled="isLoading"
            >
              📋 복잡한 샘플 (과적합)
            </button>
            <button
              type="button"
              class="theme-toggle-btn"
              style="flex: 1; justify-content: center;"
              @click="loadSample('simple')"
              :disabled="isLoading"
            >
              📋 심플한 샘플 (적정)
            </button>
          </div>
          <button
            class="btn-submit"
            @click="submitAnalysis"
            :disabled="isLoading || !markdownText.trim()"
          >
            <span v-if="isLoading" class="spinner"></span>
            <span>{{ isLoading ? '설계 분석 중...' : '🔍 설계 과적합 판독 시작' }}</span>
          </button>
        </section>

        <!-- 히스토리 목록 카드 -->
        <section class="card history-section">
          <div class="history-header">
            <h2>📜 최근 분석 히스토리</h2>
            <button 
              v-if="historyList.length > 0" 
              class="btn-clear-history" 
              @click="clearAllHistory"
            >
              전체 삭제
            </button>
          </div>
          <div v-if="historyList.length === 0" class="history-empty">
            최근 분석한 이력이 없습니다.
          </div>
          <div v-else class="history-list">
            <div 
              v-for="item in historyList" 
              :key="item.id" 
              class="history-item"
              @click="selectHistoryItem(item)"
            >
              <div class="history-item-body">
                <span class="history-item-title">{{ item.docTitle }}</span>
                <span class="history-item-time">{{ item.timestamp }}</span>
              </div>
              <button 
                class="btn-delete-item" 
                @click.stop="deleteHistoryItem(item.id)"
                title="삭제"
              >
                ×
              </button>
            </div>
          </div>
        </section>
      </div>

      <!-- Right Column: 진행률 및 결과 영역 -->
      <div class="right-column">
        <!-- 에러 알림 -->
        <div v-if="errorMessage" class="card error-card">
          <p class="error-title">⚠️ 분석 실패</p>
          <p class="error-body">{{ errorMessage }}</p>
        </div>

        <!-- 진행 상태 로더 -->
        <section v-if="isLoading" class="card progress-loader-card">
          <h2>⚙️ 분석 진행 상태</h2>
          <div class="progress-bar-container">
            <div class="progress-bar-fill" :style="{ width: `${progressPercent}%` }"></div>
          </div>
          <p class="progress-percentage-text">{{ progressPercent }}% 완료</p>
          
          <div class="progress-steps-list">
            <div 
              v-for="step in progressSteps" 
              :key="step.id" 
              class="progress-step-item"
              :class="{ 
                active: progressStep === step.id, 
                completed: progressStep > step.id,
                pending: progressStep < step.id 
              }"
            >
              <span class="step-status-icon">
                <span v-if="progressStep > step.id">✅</span>
                <span v-else-if="progressStep === step.id" class="step-spinner">⏳</span>
                <span v-else>⚪</span>
              </span>
              <span class="step-text">
                {{ step.text }}
                <small v-if="progressStep === step.id && currentProgressMessage" class="step-detail">
                  {{ currentProgressMessage }}
                </small>
              </span>
            </div>
          </div>
        </section>

        <!-- 분석 결과 표시 -->
        <section v-if="!isLoading && result" class="card result-section">
          <div class="result-header">
            <div class="result-title">
              <h2>🔍 과적합 판독 결과</h2>
              <p class="scan-time">판독 완료 시간: {{ scanTime }}</p>
            </div>
            <div class="score-badge">
              <span class="verdict-tag" :class="result.verdict">{{ result.verdict }}</span>
              <span class="score-number" :style="{ color: getVerdictColor(result.verdict) }">
                {{ result.complexity_score }}<span class="score-denom">/10</span>
              </span>
            </div>
          </div>

          <!-- 복잡도 미터 바 -->
          <div class="score-meter">
            <div
              class="score-fill"
              :class="result.verdict"
              :style="{ width: `${result.complexity_score * 10}%` }"
            ></div>
          </div>

          <!-- 문제 규모 vs 해결책 규모 -->
          <div class="size-comparison">
            <div class="size-item">
              <span class="size-label">문제 규모</span>
              <span class="size-badge problem" :class="result.problem_size.toLowerCase()">
                {{ result.problem_size }}
              </span>
            </div>
            <div class="size-arrow">
              <span class="arrow-line"></span>
              <span class="arrow-icon" :class="getSizeGapClass(result.problem_size, result.solution_size, result.verdict)">
                {{ getSizeGapIcon(result.problem_size, result.solution_size, result.verdict) }}
              </span>
              <span class="arrow-line"></span>
            </div>
            <div class="size-item">
              <span class="size-label">해결책 규모</span>
              <span class="size-badge solution" :class="result.solution_size.toLowerCase()">
                {{ result.solution_size }}
              </span>
            </div>
            <div class="size-gap-msg" :class="getSizeGapClass(result.problem_size, result.solution_size, result.verdict)">
              {{ getSizeGapMessage(result.problem_size, result.solution_size, result.verdict) }}
            </div>
          </div>

          <!-- 설명성 분석 정보 카드 -->
          <div class="explainability-container">
            <div class="explain-item">
              <span class="explain-icon">📁</span>
              <div class="explain-content">
                <span class="explain-label">설계 분류</span>
                <span class="explain-val">{{ result.detected_category }}</span>
              </div>
            </div>
            <div class="explain-item">
              <span class="explain-icon">🔍</span>
              <div class="explain-content">
                <span class="explain-label">분석 접근법</span>
                <p class="explain-desc">{{ result.analysis_approach }}</p>
              </div>
            </div>
            <div v-if="result.inferred_assumptions && result.inferred_assumptions.length > 0" class="explain-item full-width">
              <span class="explain-icon">💡</span>
              <div class="explain-content">
                <span class="explain-label">유추 및 가정 사항</span>
                <ul class="assumptions-list">
                  <li v-for="(assumption, i) in result.inferred_assumptions" :key="i">
                    {{ assumption }}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- AI 추론 분석 (Reasoning) 타이핑 연출 카드 -->
          <div class="reasoning-container">
            <div class="reasoning-header">
              <span class="section-title-icon">🤖</span>
              <span class="reasoning-title-text">AI 추론 과정 (Reasoning)</span>
              <button 
                v-if="isTyping" 
                class="btn-skip-typing" 
                @click="skipTyping"
              >
                ⏩ 건너뛰기
              </button>
            </div>
            <div class="reasoning-body">
              <p class="typing-text">
                {{ displayedReasoning }}<span v-if="isTyping" class="typing-cursor">|</span>
              </p>
            </div>
          </div>

          <!-- 순차 페이드인 표시 영역 -->
          <div v-show="showRestCards" class="fade-in-section">
            <!-- 한 줄 요약 -->
            <p class="summary-text fade-item delay-1">"{{ result.summary }}"</p>

            <!-- 과도한 설계 요소 리스트 -->
            <div class="section-title fade-item delay-2">
              <span>🚨</span> 과도한 설계 요소 ({{ result.overfit_items.length }}개)
            </div>

            <div v-if="result.overfit_items.length === 0" class="overfit-list fade-item delay-2">
              <div class="overfit-item ok-item">
                <p class="ok-text">✅ 적합한 범위의 설계입니다. 오버엔지니어링 요소를 발견하지 못했습니다.</p>
              </div>
            </div>

            <div v-else class="overfit-list fade-item delay-2">
              <div v-for="(item, index) in result.overfit_items" :key="index" class="overfit-item">
                <div class="overfit-item-header">
                  <span class="overfit-item-title">{{ index + 1 }}. {{ item.title }}</span>
                  <span class="risk-badge" :class="item.risk">위험도: {{ getRiskLabel(item.risk) }}</span>
                </div>
                <p class="overfit-item-reason">{{ item.reason }}</p>
              </div>
            </div>

            <!-- 더 작은 대안 -->
            <div class="reveal-fade-in delay-3" style="margin-top: 1.5rem;">
              <div class="section-title">
                <span>💡</span> 더 작은 대안 (Alternative)
              </div>
              <div class="alternative-box">
                <p class="alternative-desc">{{ result.alternative.description }}</p>
                <div class="alternative-savings">
                  <span>🛡️ 절감 예상 범위:</span> {{ result.alternative.savings }}
                </div>
              </div>
            </div>

            <!-- 다음 최소 작업 -->
            <div class="reveal-fade-in delay-4" style="margin-top: 1.5rem;">
              <div class="section-title">
                <span>✅</span> 다음 단계 최소 작업 (Next Small Steps)
              </div>
              <div class="tasks-list">
                <div v-for="task in result.next_tasks" :key="task.order" class="task-item">
                  <div class="task-num">{{ task.order }}</div>
                  <div class="task-text">{{ task.task }}</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- 푸터 -->
    <footer>
      <p>© {{ new Date().getFullYear() }} Overfit Checker — 이 설계, 과한가요?</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

// 결과 타입 (Zod 스키마와 동일 구조)
interface OverfitItem {
  title: string;
  reason: string;
  risk: 'low' | 'medium' | 'high';
}

interface OverfitResult {
  complexity_score: number;
  verdict: '적정' | '주의' | '과도';
  problem_size: 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Enterprise';
  solution_size: 'Script' | 'Library' | 'Service' | 'Platform' | 'Ecosystem';
  summary: string;
  reasoning: string;
  detected_category: string;
  analysis_approach: string;
  inferred_assumptions: string[];
  overfit_items: OverfitItem[];
  alternative: {
    description: string;
    savings: string;
  };
  next_tasks: {
    order: number;
    task: string;
  }[];
}

interface HistoryItem {
  id: string;
  docTitle: string;
  content: string;
  result: OverfitResult;
  timestamp: string;
}

type AnalysisStage = 'request_preparing' | 'llm_waiting' | 'validation' | 'completed';

interface ProgressPayload {
  stage: AnalysisStage | 'context_check' | 'planning' | 'delegation' | 'error';
  status: 'processing' | 'success' | 'failed';
  message: string;
  data?: unknown;
}

const PROBLEM_RANK: Record<string, number> = {
  Tiny: 0, Small: 1, Medium: 2, Large: 3, Enterprise: 4,
};
const SOLUTION_RANK: Record<string, number> = {
  Script: 0, Library: 1, Service: 2, Platform: 3, Ecosystem: 4,
};

// @ts-ignore
const appVersion = ref('v' + __APP_VERSION__);
// @ts-ignore
const appLabel = ref(__APP_LABEL__);
const markdownText = ref('');
const isLoading = ref(false);
const result = ref<OverfitResult | null>(null);
const errorMessage = ref<string | null>(null);
const isDark = ref(false);
const scanTime = ref('');

// 진행 상태 세분화 관련 변수
const progressPercent = ref(0);
const progressStep = ref(1);
const currentProgressMessage = ref('');
const progressSteps = [
  { id: 1, stage: 'request_preparing', text: '요청 준비 중' },
  { id: 2, stage: 'llm_waiting', text: 'LLM 응답 대기 중' },
  { id: 3, stage: 'validation', text: '결과 검증 중' },
  { id: 4, stage: 'completed', text: '분석 완료' }
];

// 타이핑 애니메이션 관련 변수
const displayedReasoning = ref('');
const isTyping = ref(false);
const showRestCards = ref(false);
let currentTypingTimer: any = null;

// 히스토리 관리 상태
const historyList = ref<HistoryItem[]>([]);
const activeHistoryId = ref<string | null>(null);

// 샘플 마크다운 로드
const loadSample = (type: 'aegis' | 'simple') => {
  if (type === 'aegis') {
    markdownText.value = `# 알림 마이크로서비스 아키텍처 설계안

## 개요
사용자 로그인 및 특정 이벤트 발생 시 알림(Email, Slack, SMS)을 발송하는 서버 모듈 설계입니다.

## 상세 설계안
1. **메시지 큐 및 이벤트 브로커**:
   - 메시지 손실을 원천 차단하기 위해 3개의 노드로 구성된 Apache Kafka 클러스터를 전용 서브넷에 구성합니다.
2. **영속성 스토리지**:
   - 모든 발송 이력을 분산 노드 형태로 영구 보존하기 위해 Cassandra NoSQL DB를 클러스터링 모드로 도입합니다.
3. **분산 캐시 및 세션**:
   - 알림 템플릿 및 발송 제한 상태 관리를 위해 Redis Sentinel로 고가용성 캐시 레이어를 추가합니다.
4. **인프라 환경**:
   - 스케일링 유연성을 위해 전체 모듈을 Kubernetes에 배포하고, 템플릿 리포지토리는 매 분 동기화를 위해 Git 폴링 방식의 CronJob pod를 상시 기동시킵니다.
`;
  } else {
    markdownText.value = `# 간단한 피드백 메일 전송 기능 설계안

## 개요
사용자가 웹사이트 내 문의하기 폼을 작성해 전송하면, 담당자 이메일로 해당 피드백을 전달하는 기능입니다.

## 아키텍처 구성
- 별도의 대형 메시지 큐 인프라 구축 없이, Node.js 익스프레스 서버에서 이메일 전송 패키지(\`nodemailer\`)를 사용해 직접 메일 발송 API를 호출합니다.
- 발송 횟수 제한(Rate Limit)은 단순 인메모리(\`express-rate-limit\`) 라이브러리로 제어합니다.
- 데이터베이스 저장 역시 별도로 구성하지 않고 오류 로그만 호스트 디스크의 로컬 파일 시스템에 저장합니다.
`;
  }
};

// 테마 토글
const toggleTheme = () => {
  isDark.value = !isDark.value;
  if (isDark.value) {
    document.documentElement.classList.add('dark-theme');
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark-theme');
    localStorage.setItem('theme', 'light');
  }
};

// 히스토리 관리 함수들
const saveHistory = () => {
  try {
    localStorage.setItem('overfit_history', JSON.stringify(historyList.value));
  } catch (e) {
    console.error('히스토리 저장 실패:', e);
  }
};

const addHistory = (docContent: string, resData: OverfitResult) => {
  let docTitle = '제목 없는 설계안';
  const lines = docContent.trim().split('\n');
  const firstHeader = lines.find(l => l.startsWith('#'));
  if (firstHeader) {
    docTitle = firstHeader.replace(/^#+\s+/, '').trim();
  } else if (lines[0]) {
    docTitle = lines[0].substring(0, 30).trim() + (lines[0].length > 30 ? '...' : '');
  }

  const newHistoryItem: HistoryItem = {
    id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toLocaleString(),
    docTitle,
    content: docContent,
    result: resData,
  };

  historyList.value = [newHistoryItem, ...historyList.value.filter(item => item.content !== docContent)].slice(0, 9);
  saveHistory();
  activeHistoryId.value = newHistoryItem.id;
};

const selectHistoryItem = (item: HistoryItem) => {
  if (currentTypingTimer) {
    clearInterval(currentTypingTimer);
    currentTypingTimer = null;
  }
  markdownText.value = item.content;
  result.value = item.result;
  activeHistoryId.value = item.id;
  scanTime.value = item.timestamp;
  displayedReasoning.value = item.result.reasoning || '';
  isTyping.value = false;
  showRestCards.value = true;
};

const deleteHistoryItem = (id: string) => {
  historyList.value = historyList.value.filter(item => item.id !== id);
  saveHistory();
  if (activeHistoryId.value === id) {
    activeHistoryId.value = null;
    result.value = null;
    displayedReasoning.value = '';
    showRestCards.value = false;
  }
};

const clearAllHistory = () => {
  if (confirm('모든 판독 히스토리를 삭제하시겠습니까?')) {
    historyList.value = [];
    localStorage.removeItem('overfit_history');
    activeHistoryId.value = null;
    result.value = null;
    displayedReasoning.value = '';
    showRestCards.value = false;
  }
};

// 서버 SSE 이벤트 기반 진행 상태
const setProgressStage = (payload: ProgressPayload) => {
  const stage = payload.stage;
  const normalizedStage =
    stage === 'context_check' ? 'request_preparing'
    : stage === 'planning' || stage === 'delegation' ? 'llm_waiting'
    : stage;
  const index = progressSteps.findIndex(step => step.stage === normalizedStage);
  if (index >= 0) {
    progressStep.value = index + 1;
    progressPercent.value = Math.min(95, Math.max(progressPercent.value, (index + 1) * 25));
    currentProgressMessage.value = payload.message;
  }
};

const startProgressStream = () => {
  progressStep.value = 1;
  progressPercent.value = 5;
  currentProgressMessage.value = '서버 스트림 연결을 준비하는 중...';
};

const finishProgressStream = () => {
  progressPercent.value = 100;
  progressStep.value = 4;
  currentProgressMessage.value = '최종 결과를 수신했습니다.';
};

const parseSseChunk = (buffer: string, onEvent: (event: string, data: unknown) => void): string => {
  const messages = buffer.split('\n\n');
  const remainder = messages.pop() ?? '';

  for (const message of messages) {
    const lines = message.split('\n');
    const eventLine = lines.find(line => line.startsWith('event:'));
    const dataLines = lines.filter(line => line.startsWith('data:'));
    const event = eventLine?.replace(/^event:\s*/, '').trim() ?? 'message';
    const dataText = dataLines.map(line => line.replace(/^data:\s?/, '')).join('\n');

    if (!dataText) continue;

    let parsedData: unknown;
    try {
      parsedData = JSON.parse(dataText);
    } catch (error) {
      console.error('SSE 이벤트 파싱 실패:', error);
      continue;
    }

    onEvent(event, parsedData);
  }

  return remainder;
};

// 추론 텍스트 타이핑 연출
const typeReasoning = (fullText: string) => {
  displayedReasoning.value = '';
  isTyping.value = true;
  showRestCards.value = false;
  let index = 0;
  
  if (currentTypingTimer) {
    clearInterval(currentTypingTimer);
    currentTypingTimer = null;
  }
  
  const baseSpeed = Math.max(5, Math.min(25, 1200 / (fullText || ' ').length));
  const charsPerTick = (fullText || '').length > 500 ? Math.ceil(fullText.length / 100) : 1;
  
  currentTypingTimer = setInterval(() => {
    const text = fullText || '';
    if (index < text.length) {
      displayedReasoning.value += text.slice(index, index + charsPerTick);
      index += charsPerTick;
    } else {
      clearInterval(currentTypingTimer);
      currentTypingTimer = null;
      isTyping.value = false;
      setTimeout(() => {
        showRestCards.value = true;
      }, 150);
    }
  }, baseSpeed);
};

// 타이핑 건너뛰기
const skipTyping = () => {
  if (isTyping.value) {
    if (currentTypingTimer) {
      clearInterval(currentTypingTimer);
      currentTypingTimer = null;
    }
    displayedReasoning.value = result.value?.reasoning || '';
    isTyping.value = false;
    showRestCards.value = true;
  }
};

// 과적합 분석 제출
const submitAnalysis = async () => {
  if (!markdownText.value.trim()) return;

  isLoading.value = true;
  result.value = null;
  errorMessage.value = null;
  displayedReasoning.value = '';
  showRestCards.value = false;
  activeHistoryId.value = null;

  startProgressStream();

  try {
    const response = await fetch('/api/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({ content: markdownText.value }),
    });

    if (!response.ok || !response.body) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || '분석 중 원인 미상의 오류가 발생했습니다.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    const finalResultRef: { value: OverfitResult | null } = { value: null };

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      buffer = parseSseChunk(buffer, (event, data) => {
        if (event === 'progress') {
          const payload = data as ProgressPayload;
          setProgressStage(payload);
        } else if (event === 'result') {
          finalResultRef.value = data as OverfitResult;
          finishProgressStream();
        } else if (event === 'error') {
          const payload = data as { error?: string };
          throw new Error(payload.error || '분석 중 원인 미상의 오류가 발생했습니다.');
        }
      });
    }

    const completedResult = finalResultRef.value;

    if (!completedResult) {
      throw new Error('분석 결과 이벤트를 수신하지 못했습니다.');
    }

    finishProgressStream();
    await new Promise(r => setTimeout(r, 200));

    result.value = completedResult;
    scanTime.value = new Date().toLocaleString();
    
    addHistory(markdownText.value, completedResult);
    typeReasoning(completedResult.reasoning);
  } catch (err) {
    finishProgressStream();
    errorMessage.value = err instanceof Error ? err.message : String(err);
  } finally {
    isLoading.value = false;
  }
};

// 초기 테마 및 히스토리 확인
onMounted(() => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDark.value = true;
    document.documentElement.classList.add('dark-theme');
  } else {
    isDark.value = false;
    document.documentElement.classList.remove('dark-theme');
  }

  try {
    const savedHistory = localStorage.getItem('overfit_history');
    if (savedHistory) {
      historyList.value = JSON.parse(savedHistory);
    }
  } catch (e) {
    console.error('히스토리 로드 실패:', e);
  }
});

// 규모 불균형 헬퍼
const getSizeGap = (problemSize: string, solutionSize: string): number => {
  return (SOLUTION_RANK[solutionSize] ?? 0) - (PROBLEM_RANK[problemSize] ?? 0);
};

const getSizeGapClass = (problemSize: string, solutionSize: string, verdict: string): string => {
  if (verdict === '적정') return 'gap-ok';
  const gap = getSizeGap(problemSize, solutionSize);
  if (gap >= 2) return 'gap-danger';
  if (gap === 1) return 'gap-warning';
  return 'gap-ok';
};

const getSizeGapIcon = (problemSize: string, solutionSize: string, verdict: string): string => {
  if (verdict === '적정') return '✅';
  const gap = getSizeGap(problemSize, solutionSize);
  if (gap >= 2) return '🚨';
  if (gap === 1) return '⚠️';
  return '✅';
};

const getSizeGapMessage = (problemSize: string, solutionSize: string, verdict: string): string => {
  if (verdict === '적정') return '균형 잡힌 설계입니다 (적정 설계)';
  const gap = getSizeGap(problemSize, solutionSize);
  if (gap >= 2) return '규모 불균형 — 해결책이 문제보다 훨씬 큽니다';
  if (gap === 1) return '규모 차이 — 약간 과도할 수 있습니다';
  return '균형 잡힌 설계입니다';
};

// 라벨링 헬퍼
const getRiskLabel = (risk: 'low' | 'medium' | 'high') => {
  const mapping = { low: '낮음', medium: '중간', high: '높음' };
  return mapping[risk] || risk;
};

const getVerdictColor = (verdict: '적정' | '주의' | '과도') => {
  const mapping = { 적정: 'var(--success)', 주의: 'var(--warning)', 과도: 'var(--danger)' };
  return mapping[verdict] || 'inherit';
};
</script>
