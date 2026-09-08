// 임대주택 파인더 핵심 애플리케이션 로직

// 전역 상태
const state = {
  // 1단계: 지역 정보
  userSido: "서울특별시",
  userGugun: "강남구",
  workSido: "서울특별시",
  workGugun: "강남구",
  targetSido: "서울특별시",
  targetGugun: "강남구",

  // 2단계: 자격 상세 조건
  category: "youth", // youth, student, newlywed, newborn, senior, general, multi-child
  householdMembers: 1,
  monthlyIncome: 250, // 단위: 만원
  isDualIncome: false,
  isHomeless: true,
  carStatus: "none", // none, under-limit, over-limit
  totalAssetStatus: "under-youth", // under-youth, under-general, over-general
  bankAccountTimes: "over-24", // none, under-6, 6-23, over-24
  
  // 탭 및 날짜 필터 상태
  currentTab: "all", // all, eligible
  onlyApplyable: true, // 항상 최신 날짜 기준 신청 가능한 곳만 보기 (기본값 TRUE)
  baseDate: new Date(),

  // 공공데이터포털 실시간 연동 상태
  realAnnouncements: null,
  lastUpdatedText: "매일 자정 자동 갱신",
  dataSource: "공공데이터포털(data.go.kr) 실시간 파이프라인"
};

// 각 주택 유형에 대한 진단 결과 보관용 변수 (상단 선언으로 TDZ 에러 방지)
let calculatedHousingList = [];



/**
 * 안전한 앱 초기화 실행기 (DOM 로딩 상태 완벽 대응)
 */
function startApplication() {
  if (window.__app_initialized) return;
  window.__app_initialized = true;

  displayCurrentDate();
  populateSelectOptions();
  setupEventListeners();
  updateIncomeStandardDisplay();
  calculateAndRender();

  // 공공데이터포털 실시간 JSON 비동기 로드
  loadRealAnnouncements();
}

/**
 * data/real-announcements.json 비동기 로딩 및 상태 갱신
 */
async function loadRealAnnouncements() {
  try {
    const res = await fetch('data/real-announcements.json');
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.items) && data.items.length > 0) {
        state.realAnnouncements = data.items;
        state.lastUpdatedText = data.lastUpdatedText || "최근 갱신됨";
        state.dataSource = data.source || "공공데이터포털(data.go.kr)";
        
        // 상태 뱃지 업데이트
        updateApiStatusDisplay(data.lastUpdatedText, data.source);

        // 공고 목록 다시 렌더링
        const regionEval = evaluateRegionalPriority(
          state.userSido, state.userGugun, state.workSido, state.workGugun, state.targetSido, state.targetGugun
        );
        renderMatchingAnnouncements(regionEval);
        console.log('✅ 공공데이터포털 최신 공고 데이터를 성공적으로 로드했습니다.');
      }
    }
  } catch (err) {
    console.log('ℹ️ 로컬/정적 모드로 공고 템플릿 엔진을 사용합니다.');
  }
}

/**
 * 실시간 API 동기화 상태 뱃지 표시
 */
function updateApiStatusDisplay(lastUpdated, source) {
  const badgeEl = document.getElementById("api-sync-badge");
  if (!badgeEl) return;
  badgeEl.innerHTML = `
    <span class="inline-flex items-center gap-1.5 bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-full text-xs font-semibold">
      <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
      <span>자동 갱신: ${lastUpdated}</span>
    </span>
  `;
}


if (document.readyState === 'loading') {
  document.addEventListener("DOMContentLoaded", startApplication);
} else {
  startApplication();
}
window.addEventListener("load", startApplication);

/**
 * 최상단 오늘 날짜 표시 함수
 */
function displayCurrentDate() {
  const now = state.baseDate;
  const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const date = now.getDate();
  const dayName = days[now.getDay()];
  const formatted = `${year}년 ${month}월 ${date}일 (${dayName})`;

  const topHeaderEl = document.getElementById("header-today-date");
  if (topHeaderEl) {
    topHeaderEl.textContent = formatted;
  }

  const bannerEl = document.getElementById("banner-today-date");
  if (bannerEl) {
    bannerEl.textContent = formatted;
  }
}

/**
 * 시/도 및 구/군 셀렉트 박스 옵션 초기화
 */
function populateSelectOptions() {
  if (typeof KOREA_REGIONS === 'undefined') {
    console.error("KOREA_REGIONS 데이터가 로드되지 않았습니다.");
    return;
  }

  const sidoList = Object.keys(KOREA_REGIONS);
  const sidoSelects = ["user-sido", "work-sido", "target-sido"];

  sidoSelects.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = "";
    
    // 직장/학교는 '선택 안함(해당없음)' 옵션 추가
    if (id === "work-sido") {
      const defaultOpt = document.createElement("option");
      defaultOpt.value = "";
      defaultOpt.textContent = "선택 안 함 (무직 또는 재택)";
      el.appendChild(defaultOpt);
    }

    sidoList.forEach((sido) => {
      const opt = document.createElement("option");
      opt.value = sido;
      opt.textContent = sido;
      if (sido === "서울특별시") opt.selected = true;
      el.appendChild(opt);
    });
  });

  // 초기 구/군 렌더링
  updateGugunSelect("user-sido", "user-gugun", state.userSido);
  updateGugunSelect("work-sido", "work-gugun", state.workSido);
  updateGugunSelect("target-sido", "target-gugun", state.targetSido);
}

/**
 * 특정 시/도 선택에 따른 시/군/구 옵션 갱신
 */
function updateGugunSelect(sidoSelectId, gugunSelectId, selectedSido) {
  const gugunEl = document.getElementById(gugunSelectId);
  if (!gugunEl) return;
  gugunEl.innerHTML = "";

  if (!selectedSido) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "시/도를 먼저 선택하세요";
    gugunEl.appendChild(opt);
    gugunEl.disabled = true;
    return;
  }

  gugunEl.disabled = false;
  const guguns = (typeof KOREA_REGIONS !== 'undefined' && KOREA_REGIONS[selectedSido]) ? KOREA_REGIONS[selectedSido] : [];
  
  // 전체 시군 선택 옵션
  const allOpt = document.createElement("option");
  allOpt.value = "";
  allOpt.textContent = `${selectedSido} 전체`;
  gugunEl.appendChild(allOpt);

  guguns.forEach((gugun) => {
    const opt = document.createElement("option");
    opt.value = gugun;
    opt.textContent = gugun;
    if (gugun === "강남구" && selectedSido === "서울특별시") {
      opt.selected = true;
    }
    gugunEl.appendChild(opt);
  });
}

/**
 * 이벤트 리스너 등록
 */
function setupEventListeners() {
  // 지역 선택 변경 이벤트
  document.getElementById("user-sido")?.addEventListener("change", (e) => {
    state.userSido = e.target.value;
    updateGugunSelect("user-sido", "user-gugun", state.userSido);
    state.userGugun = document.getElementById("user-gugun").value;
    calculateAndRender();
  });

  document.getElementById("user-gugun")?.addEventListener("change", (e) => {
    state.userGugun = e.target.value;
    calculateAndRender();
  });

  document.getElementById("work-sido")?.addEventListener("change", (e) => {
    state.workSido = e.target.value;
    updateGugunSelect("work-sido", "work-gugun", state.workSido);
    state.workGugun = document.getElementById("work-gugun").value;
    calculateAndRender();
  });

  document.getElementById("work-gugun")?.addEventListener("change", (e) => {
    state.workGugun = e.target.value;
    calculateAndRender();
  });

  document.getElementById("target-sido")?.addEventListener("change", (e) => {
    state.targetSido = e.target.value;
    updateGugunSelect("target-sido", "target-gugun", state.targetSido);
    state.targetGugun = document.getElementById("target-gugun").value;
    calculateAndRender();
  });

  document.getElementById("target-gugun")?.addEventListener("change", (e) => {
    state.targetGugun = e.target.value;
    calculateAndRender();
  });

  // 희망지역을 거주지/직장지와 동일하게 빠르게 설정하는 버튼
  document.getElementById("btn-set-target-residence")?.addEventListener("click", () => {
    document.getElementById("target-sido").value = state.userSido;
    state.targetSido = state.userSido;
    updateGugunSelect("target-sido", "target-gugun", state.targetSido);
    document.getElementById("target-gugun").value = state.userGugun;
    state.targetGugun = state.userGugun;
    calculateAndRender();
  });

  document.getElementById("btn-set-target-work")?.addEventListener("click", () => {
    if (!state.workSido) return;
    document.getElementById("target-sido").value = state.workSido;
    state.targetSido = state.workSido;
    updateGugunSelect("target-sido", "target-gugun", state.targetSido);
    document.getElementById("target-gugun").value = state.workGugun;
    state.targetGugun = state.workGugun;
    calculateAndRender();
  });

  // 신청자 계층 변경
  document.getElementById("applicant-category")?.addEventListener("change", (e) => {
    state.category = e.target.value;
    const dualIncomeWrapper = document.getElementById("dual-income-wrapper");
    if (state.category === "newlywed" || state.category === "newborn") {
      dualIncomeWrapper?.classList.remove("hidden");
    } else {
      dualIncomeWrapper?.classList.add("hidden");
      state.isDualIncome = false;
      const chk = document.getElementById("is-dual-income");
      if (chk) chk.checked = false;
    }
    calculateAndRender();
  });

  document.getElementById("is-dual-income")?.addEventListener("change", (e) => {
    state.isDualIncome = e.target.checked;
    calculateAndRender();
  });

  // 가구원 수 변경
  document.getElementById("household-members")?.addEventListener("change", (e) => {
    state.householdMembers = parseInt(e.target.value, 10);
    updateIncomeStandardDisplay();
    calculateAndRender();
  });

  // 월 소득 슬라이더 및 인풋
  const incomeSlider = document.getElementById("monthly-income-slider");
  const incomeInput = document.getElementById("monthly-income-input");

  incomeSlider?.addEventListener("input", (e) => {
    const val = parseInt(e.target.value, 10);
    state.monthlyIncome = val;
    if (incomeInput) incomeInput.value = val;
    calculateAndRender();
  });

  incomeInput?.addEventListener("input", (e) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 0) val = 0;
    if (val > 1500) val = 1500;
    state.monthlyIncome = val;
    if (incomeSlider) incomeSlider.value = val;
    calculateAndRender();
  });

  // 무주택 여부
  document.querySelectorAll("input[name='homeless-status']").forEach((radio) => {
    radio.addEventListener("change", (e) => {
      state.isHomeless = (e.target.value === "true");
      calculateAndRender();
    });
  });

  // 차량 보유 상태
  document.getElementById("car-status")?.addEventListener("change", (e) => {
    state.carStatus = e.target.value;
    calculateAndRender();
  });

  // 총자산 상태
  document.getElementById("asset-status")?.addEventListener("change", (e) => {
    state.totalAssetStatus = e.target.value;
    calculateAndRender();
  });

  // 청약통장 납입 횟수
  document.getElementById("subscription-times")?.addEventListener("change", (e) => {
    state.bankAccountTimes = e.target.value;
    calculateAndRender();
  });

  // 오늘 기준 신청 가능한 곳만 보기 토글 체크박스
  document.getElementById("filter-only-applyable")?.addEventListener("change", (e) => {
    state.onlyApplyable = e.target.checked;
    const regionEval = evaluateRegionalPriority(
      state.userSido, state.userGugun, state.workSido, state.workGugun, state.targetSido, state.targetGugun
    );
    renderMatchingAnnouncements(regionEval);
  });

  // 결과 필터 탭
  document.querySelectorAll(".result-filter-tab").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".result-filter-tab").forEach(b => {
        b.classList.remove("bg-blue-600", "text-white");
        b.classList.add("bg-slate-100", "text-slate-700", "hover:bg-slate-200");
      });
      btn.classList.add("bg-blue-600", "text-white");
      btn.classList.remove("bg-slate-100", "text-slate-700", "hover:bg-slate-200");
      state.currentTab = btn.dataset.tab;
      renderHousingCards();
    });
  });
}

/**
 * 가구원수별 소득 기준 안내 박스 갱신
 */
function updateIncomeStandardDisplay() {
  if (typeof INCOME_STANDARDS === 'undefined') return;
  const members = Math.min(Math.max(state.householdMembers, 1), 5);
  const std = INCOME_STANDARDS[members];
  const box = document.getElementById("income-guide-box");
  if (!box || !std) return;

  box.innerHTML = `
    <div class="text-xs font-semibold text-slate-500 mb-1">
      📊 ${members}인 가구 기준 월평균 소득표 (2024~2026 기준):
    </div>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
      <div class="bg-blue-50 border border-blue-100 rounded px-2 py-1">
        <span class="font-bold text-blue-700">70% 이하:</span> <strong>${std[70]}만 원</strong>
      </div>
      <div class="bg-emerald-50 border border-emerald-100 rounded px-2 py-1">
        <span class="font-bold text-emerald-700">100% 이하:</span> <strong>${std[100]}만 원</strong>
      </div>
      <div class="bg-amber-50 border border-amber-100 rounded px-2 py-1">
        <span class="font-bold text-amber-700">120% 이하:</span> <strong>${std[120]}만 원</strong>
      </div>
      <div class="bg-purple-50 border border-purple-100 rounded px-2 py-1">
        <span class="font-bold text-purple-700">150% 이하:</span> <strong>${std[150]}만 원</strong>
      </div>
    </div>
  `;
}

/**
 * 종합 계산 및 렌더링
 */
function calculateAndRender() {
  if (typeof evaluateRegionalPriority !== 'function') return;

  // 1. 지역 우선순위 판정
  const regionEval = evaluateRegionalPriority(
    state.userSido,
    state.userGugun,
    state.workSido,
    state.workGugun,
    state.targetSido,
    state.targetGugun
  );

  renderRegionSummary(regionEval);

  // 2. 주택 유형별 자격 진단
  evaluateHousingEligibility(regionEval);

  // 3. 카드 렌더링
  renderHousingCards();

  // 4. 공식 사이트 바로가기 버튼 업데이트
  updateOfficialSiteLinks();

  // 5. 최신 날짜 기준 신청 가능 공고 필터링 렌더링
  renderMatchingAnnouncements(regionEval);
}

/**
 * 상단 지역 순위 요약 배너 렌더링
 */
function renderRegionSummary(evalResult) {
  const container = document.getElementById("regional-priority-result");
  if (!container) return;

  const targetLabel = `${state.targetSido} ${state.targetGugun || '전체'}`;

  container.innerHTML = `
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border ${evalResult.badgeColor} bg-opacity-30">
      <div class="flex items-start gap-3">
        <div class="p-2.5 rounded-lg bg-white shadow-sm border border-slate-200">
          <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </div>
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-xs font-bold px-2 py-0.5 rounded-full ${evalResult.badgeColor} border">
              ${evalResult.rankText}
            </span>
            <h3 class="font-bold text-slate-900 text-base sm:text-lg">
              신청 희망 지역: <span class="text-blue-700">${targetLabel}</span>
            </h3>
          </div>
          <p class="text-sm text-slate-700 mt-1 leading-relaxed">
            ${evalResult.description}
          </p>
        </div>
      </div>
      <div class="text-right sm:self-center shrink-0">
        <a href="#official-platforms-section" class="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-lg transition shadow-sm">
          <span>공식 공고 확인</span>
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
        </a>
      </div>
    </div>
  `;
}

/**
 * 모든 임대주택 유형에 대한 적격성 판정
 */
function evaluateHousingEligibility(regionEval) {
  if (typeof HOUSING_TYPES === 'undefined' || typeof INCOME_STANDARDS === 'undefined') return;

  const members = Math.min(Math.max(state.householdMembers, 1), 5);
  const std = INCOME_STANDARDS[members];

  calculatedHousingList = HOUSING_TYPES.map((type) => {
    const reasons = [];
    let isEligible = true;
    let isWarning = false;

    // 1. 무주택 요건 검사
    if (type.requireHomeless && !state.isHomeless) {
      isEligible = false;
      reasons.push("무주택세대구성원 요건 미충족 (유주택자 신청 불가)");
    }

    // 2. 신청 계층 검사
    if (!type.targetCategory.includes(state.category)) {
      isEligible = false;
      const catNames = {
        youth: "청년", student: "대학생", newlywed: "신혼부부", 
        newborn: "신생아가구", senior: "고령자", general: "일반가구",
        "multi-child": "다자녀가구", vulnerable: "취약계층"
      };
      const validNames = type.targetCategory.map(c => catNames[c] || c).join(", ");
      reasons.push(`현재 선택하신 계층(${catNames[state.category]}) 대상이 아닙니다. (대상: ${validNames})`);
    }

    // 3. 소득 요건 검사
    let maxRatio = type.maxIncomeRatio;
    if ((state.category === "newlywed" || state.category === "newborn") && state.isDualIncome) {
      maxRatio += 20;
    }

    if (maxRatio < 900) {
      const maxAllowedIncome = std[maxRatio] || Math.round((std[100] * maxRatio) / 100);
      if (state.monthlyIncome > maxAllowedIncome) {
        isEligible = false;
        reasons.push(`월소득 기준(${maxRatio}% 이하: 월 ${maxAllowedIncome}만원) 초과 (현재 월 ${state.monthlyIncome}만원)`);
      } else {
        reasons.push(`소득 요건 충족 (월 ${state.monthlyIncome}만원 ≤ 기준 ${maxAllowedIncome}만원)`);
      }
    } else {
      reasons.push("소득 제한 없음 (일반 공급 기준)");
    }

    // 4. 자동차 요건 검사
    if (type.requireCarCheck) {
      if (state.carStatus === "over-limit") {
        isEligible = false;
        reasons.push("자동차가액 기준(약 3,708만원 이하) 초과");
      } else if (type.id === "youth-purchase" && state.carStatus !== "none") {
        isWarning = true;
        reasons.push("청년 매입임대는 원칙적으로 차량 미보유자 우선 (생업용 차량 증명 필요)");
      }
    }

    // 5. 자산 요건 검사
    if (type.assetLimitType === "youth") {
      if (state.totalAssetStatus === "over-general" || state.totalAssetStatus === "under-general") {
        if (state.totalAssetStatus === "under-general") {
          isWarning = true;
          reasons.push("청년 총자산 기준(2.73억 이하) 확인 필요");
        } else {
          isEligible = false;
          reasons.push("청년 총자산 기준(2억 7,300만원 이하) 초과");
        }
      }
    } else if (type.assetLimitType === "general") {
      if (state.totalAssetStatus === "over-general") {
        isEligible = false;
        reasons.push("총자산 기준(3억 4,500만원 이하) 초과");
      }
    }

    // 6. 기관별 정밀 거주 요건 검사 (SH, GH, LH 특화 규정)
    if (type.id === "longterm-jeonse") {
      // SH 장기전세(Shift)는 공고일 현재 '서울특별시 주민등록 거주자'만 신청 가능 (직장이 서울이어도 불가)
      if (state.targetSido === "서울특별시") {
        if (state.userSido !== "서울특별시") {
          isEligible = false;
          reasons.push("SH 장기전세 거주요건 미충족: 공고일 현재 '서울특별시 주민등록 등재 거주자'만 신청 가능합니다. (직장·학교만 서울인 경우 신청 불가)");
        } else {
          reasons.push("서울시 주민등록 거주자 요건 충족 (SH 장기전세 신청 가능)");
        }
      } else {
        isEligible = false;
        reasons.push("장기전세(Shift)는 서울특별시 관내 공급 전용 주택입니다.");
      }
    }

    if (type.id === "seoul-youth-safe") {
      // 서울 청년안심주택: 서울시 거주자 또는 서울 소재 직장(소득활동)·대학교 재학자 필수
      if (state.targetSido === "서울특별시") {
        const isSeoulResidentOrWorker = (state.userSido === "서울특별시" || state.workSido === "서울특별시");
        if (!isSeoulResidentOrWorker) {
          isEligible = false;
          reasons.push("서울 청년안심주택 요건 미충족: 서울시 거주자 또는 서울 소재 직장·대학 재직(재학)자만 신청 가능합니다.");
        } else {
          reasons.push("서울시 거주 또는 직장·학교 연계 요건 충족");
        }
      } else {
        isEligible = false;
        reasons.push("청년안심주택은 서울특별시 관내 역세권 공급 전용 주택입니다.");
      }
    }

    if (type.id === "happy-housing") {
      if (state.targetSido === "서울특별시") {
        const hasSeoulConnection = (state.userSido === "서울특별시" || state.workSido === "서울특별시");
        if (!hasSeoulConnection) {
          isWarning = true;
          reasons.push("서울 행복주택 순위 주의: 서울 거주자 및 서울 소재 직장인에게 1순위가 우선 배정되어 타지역 거주자는 사실상 당첨이 어렵습니다.");
        }
      }
    }

    if (type.id === "national-rental") {
      if (state.targetSido === "서울특별시") {
        if (state.userSido !== "서울특별시") {
          isWarning = true;
          reasons.push("SH 서울 국민임대는 서울시 거주자 한정이며, LH 국민임대 역시 해당 자치구 거주자에게 1순위가 부여됩니다.");
        }
      }
    }


    return {
      ...type,
      isEligible,
      isWarning,
      reasons,
      regionalRank: regionEval.rankText,
      regionalBadge: regionEval.badgeColor
    };
  });
}

/**
 * 주택 유형 카드 목록 렌더링
 */
function renderHousingCards() {
  const container = document.getElementById("housing-results-container");
  if (!container) return;
  container.innerHTML = "";

  let listToRender = calculatedHousingList;

  if (state.currentTab === "eligible") {
    listToRender = calculatedHousingList.filter(h => h.isEligible);
  }

  if (listToRender.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 p-8">
        <div class="text-4xl mb-3">🔍</div>
        <h4 class="text-lg font-bold text-slate-800 mb-1">조건에 부합하는 주택 유형이 없습니다</h4>
        <p class="text-sm text-slate-600">소득 또는 가구원수, 자산 조건을 조정하거나 '전체 보기' 탭을 확인해보세요.</p>
      </div>
    `;
    return;
  }

  listToRender.forEach((housing) => {
    const card = document.createElement("div");
    card.className = `bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md flex flex-col justify-between ${
      housing.isEligible 
        ? "border-blue-200 hover:border-blue-400" 
        : "border-slate-200 opacity-80 hover:opacity-100"
    }`;

    // 상태 뱃지
    let statusBadge = "";
    if (housing.isEligible) {
      if (housing.isWarning) {
        statusBadge = `<span class="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-300">조건부 신청가능</span>`;
      } else {
        statusBadge = `<span class="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-300">✓ 신청 자격 충족</span>`;
      }
    } else {
      statusBadge = `<span class="bg-rose-100 text-rose-700 text-xs font-bold px-2.5 py-1 rounded-full border border-rose-300">신청 불가 (요건 확인)</span>`;
    }

    const featureListHtml = housing.features.map(f => `
      <li class="flex items-start gap-1.5 text-xs text-slate-600">
        <span class="text-blue-500 font-bold">•</span>
        <span>${f}</span>
      </li>
    `).join("");

    const reasonsHtml = housing.reasons.map(r => `
      <li class="text-xs ${r.includes('초과') || r.includes('미충족') || r.includes('아닙니다') ? 'text-rose-600 font-medium' : 'text-slate-600'}">
        ${r.includes('초과') || r.includes('미충족') ? '✕ ' : '✓ '} ${r}
      </li>
    `).join("");

    card.innerHTML = `
      <div class="p-5">
        <div class="flex items-start justify-between gap-2 mb-2.5">
          <h4 class="text-base font-bold text-slate-900">${housing.name}</h4>
          ${statusBadge}
        </div>
        <p class="text-xs text-slate-500 mb-3 leading-relaxed">${housing.description}</p>
        
        <div class="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-3.5 space-y-1.5">
          <div class="flex justify-between text-xs">
            <span class="text-slate-500">예상 임대료:</span>
            <span class="font-bold text-slate-800">${housing.rentRate}</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-slate-500">최대 거주 기간:</span>
            <span class="font-bold text-slate-800">${housing.stayPeriod}</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-slate-500">희망지역 신청 순위:</span>
            <span class="font-bold text-blue-700">${housing.regionalRank}</span>
          </div>
        </div>

        <div class="mb-3">
          <span class="text-xs font-bold text-slate-700 block mb-1">핵심 특징:</span>
          <ul class="space-y-1">${featureListHtml}</ul>
        </div>

        <div class="border-t border-slate-100 pt-3">
          <span class="text-xs font-bold text-slate-700 block mb-1">내 조건 진단 결과:</span>
          <ul class="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200">${reasonsHtml}</ul>
        </div>
      </div>

      <div class="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
        <div class="text-xs text-slate-500">
          신청처: <span class="font-semibold text-slate-700">${housing.officialSites.slice(0, 2).join(", ")}</span>
        </div>
        <a href="#official-platforms-section" class="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1">
          공고 보러가기 →
        </a>
      </div>
    `;

    container.appendChild(card);
  });
}

/**
 * 공식 청약 사이트 바로가기 버튼 동적 업데이트
 */
function updateOfficialSiteLinks() {
  if (typeof OFFICIAL_PLATFORMS === 'undefined') return;
  const container = document.getElementById("official-platforms-grid");
  if (!container) return;
  container.innerHTML = "";

  OFFICIAL_PLATFORMS.forEach((platform) => {
    let isRecommended = false;
    if (platform.id === "sh" && state.targetSido === "서울특별시") isRecommended = true;
    if (platform.id === "gh" && state.targetSido === "경기도") isRecommended = true;
    if (platform.id === "lh" || platform.id === "myhome") isRecommended = true;

    const card = document.createElement("div");
    card.className = `bg-white rounded-2xl border p-5 transition-all shadow-sm hover:shadow-md flex flex-col justify-between ${
      isRecommended ? "border-blue-300 ring-1 ring-blue-100" : "border-slate-200"
    }`;

    card.innerHTML = `
      <div>
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold px-2 py-0.5 rounded-full ${isRecommended ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'}">
            ${platform.badge}
          </span>
          ${isRecommended ? '<span class="text-xs font-bold text-emerald-600">★ 현재 지역 추천</span>' : ''}
        </div>
        <h4 class="font-bold text-base text-slate-900 mb-1">${platform.name}</h4>
        <p class="text-xs text-blue-600 font-medium mb-2">${platform.tagline}</p>
        <p class="text-xs text-slate-600 leading-relaxed mb-4">${platform.features}</p>
      </div>

      <div class="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
        <a href="${platform.noticeUrl}" target="_blank" rel="noopener noreferrer" 
           class="flex-1 text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 px-3 rounded-xl transition shadow-sm inline-flex items-center justify-center gap-1">
          <span>실시간 공고 검색</span>
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
        </a>
        <a href="${platform.url}" target="_blank" rel="noopener noreferrer" 
           class="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2.5 px-3 rounded-xl transition text-center inline-flex items-center justify-center">
          홈페이지
        </a>
      </div>
    `;

    container.appendChild(card);
  });
}

/**
 * 실시간 공고 매칭 렌더링 (공공데이터포털 연동 데이터 우선 및 최신 날짜 D-Day 판정)
 */
function renderMatchingAnnouncements(regionEval) {
  const container = document.getElementById("matching-announcements-list");
  const countBadgeEl = document.getElementById("matching-count-badge");
  if (!container) return;
  container.innerHTML = "";

  // 1. 공공데이터포털 실시간 데이터가 있으면 사용, 없으면 동적 템플릿 사용
  let sourceList = state.realAnnouncements;
  if (!sourceList || sourceList.length === 0) {
    sourceList = typeof getDynamicAnnouncements === 'function' 
      ? getDynamicAnnouncements(state.baseDate) 
      : (typeof MOCK_ANNOUNCEMENTS !== 'undefined' ? MOCK_ANNOUNCEMENTS : []);
  }

  const now = state.baseDate || new Date();
  const nowTime = now.getTime();

  // 각 공고에 대해 오늘 날짜 기준 실시간 D-Day 및 접수 상태 재계산
  const computedList = sourceList.map((anc) => {
    let startDate = null;
    let endDate = null;

    if (anc.startDateStr && anc.endDateStr) {
      const sp = anc.startDateStr.split('.');
      const ep = anc.endDateStr.split('.');
      if (sp.length === 3) startDate = new Date(parseInt(sp[0]), parseInt(sp[1]) - 1, parseInt(sp[2]));
      if (ep.length === 3) endDate = new Date(parseInt(ep[0]), parseInt(ep[1]) - 1, parseInt(ep[2]), 23, 59, 59);
    }

    if (!startDate || !endDate) {
      return anc;
    }

    const startTime = startDate.getTime();
    const endTime = endDate.getTime();

    let status = "접수중";
    let statusBadge = "bg-emerald-100 text-emerald-800 border-emerald-300";
    let isApplyable = true;
    let dDayText = "";

    if (nowTime < startTime) {
      status = "접수예정";
      statusBadge = "bg-amber-100 text-amber-800 border-amber-300";
      const diffDays = Math.ceil((startTime - nowTime) / (1000 * 60 * 60 * 24));
      dDayText = `D-${diffDays}일 후 시작`;
    } else if (nowTime > endTime) {
      status = "마감됨";
      statusBadge = "bg-slate-100 text-slate-500 border-slate-300";
      isApplyable = false;
      dDayText = "접수종료";
    } else {
      status = "접수중";
      statusBadge = "bg-emerald-100 text-emerald-800 border-emerald-300";
      const remainDays = Math.ceil((endTime - nowTime) / (1000 * 60 * 60 * 24));
      dDayText = remainDays <= 3 ? `🔥 D-${remainDays}일 (마감임박)` : `D-${remainDays}일 남음`;
    }

    return {
      ...anc,
      status,
      statusBadge,
      isApplyable,
      dDayText
    };
  });

  // 2. 신청 가능 필터링 (항상 최신날짜 기준 신청 가능한 곳만)
  let filtered = computedList.filter(a => {
    if (state.onlyApplyable) {
      return a.isApplyable === true;
    }
    return true;
  });

  // 3. 희망 지역 일치 공고 우선 정렬
  filtered.sort((a, b) => {
    const aTarget = (a.sido === state.targetSido) ? 1 : 0;
    const bTarget = (b.sido === state.targetSido) ? 1 : 0;
    if (bTarget !== aTarget) return bTarget - aTarget;
    if (a.status === "접수중" && b.status !== "접수중") return -1;
    if (b.status === "접수중" && a.status !== "접수중") return 1;
    return 0;
  });

  if (countBadgeEl) {
    countBadgeEl.textContent = `총 ${filtered.length}건`;
  }


  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
        <p class="font-bold text-slate-700 mb-1">현재 신청 가능한 공고가 없습니다.</p>
        <p class="text-xs text-slate-500">'마감된 공고 포함'을 체크하거나 공식 사이트 바로가기에서 실시간 공고를 확인해 보세요.</p>
      </div>
    `;
    return;
  }

  filtered.forEach((anc) => {
    const isTargetRegion = (anc.sido === state.targetSido);
    const item = document.createElement("div");
    item.className = `p-4 sm:p-5 rounded-2xl border bg-white transition hover:border-blue-300 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
      isTargetRegion ? "border-blue-300 bg-blue-50/30 ring-1 ring-blue-100" : "border-slate-200"
    }`;

    item.innerHTML = `
      <div class="space-y-1.5 flex-1">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-xs font-bold px-2 py-0.5 rounded border ${anc.statusBadge}">${anc.status}</span>
          <span class="text-xs font-black px-2 py-0.5 rounded bg-blue-600 text-white">${anc.dDayText}</span>
          <span class="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">${anc.agency}</span>
          <span class="text-xs font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-100">${anc.housingType}</span>
          ${isTargetRegion ? '<span class="text-xs font-extrabold text-blue-700 bg-yellow-100 px-2 py-0.5 rounded border border-yellow-300">★ 선택 희망지역</span>' : ''}
        </div>
        <h5 class="font-bold text-slate-900 text-base sm:text-lg">${anc.title}</h5>
        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
          <span>📍 <strong>${anc.sido} ${anc.gugun}</strong></span>
          <span>📅 <strong>진행 상태:</strong> ${anc.period}</span>
          <span>🏢 <strong>대상:</strong> ${anc.scale}</span>
        </div>
        ${anc.guideTip ? `
        <div class="mt-2 text-xs bg-blue-50/70 p-2.5 rounded-xl border border-blue-100 text-blue-900 leading-relaxed">
          <strong>💡 공고문 확인 팁:</strong> ${anc.guideTip}
        </div>
        ` : ''}
      </div>
      <div class="shrink-0 flex items-center gap-2">
        <a href="${anc.link}" target="_blank" rel="noopener noreferrer" 
           class="w-full md:w-auto text-center px-4 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition shadow-sm inline-flex items-center justify-center gap-1.5">
          <span>${anc.actionText || '공식 공고 게시판 바로가기'}</span>
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
        </a>
      </div>
    `;

    container.appendChild(item);
  });
}
