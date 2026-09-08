// 대한민국 행정구역 데이터 및 연접 시군구 매핑
const KOREA_REGIONS = {
  "서울특별시": [
    "강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구", "금천구",
    "노원구", "도봉구", "동대문구", "동작구", "마포구", "서대문구", "서초구", "성동구",
    "성북구", "송파구", "양천구", "영등포구", "용산구", "은평구", "종로구", "중구", "중랑구"
  ],
  "경기도": [
    "수원시", "고양시", "용인시", "성남시", "부천시", "화성시", "안산시", "남양주시",
    "안양시", "평택시", "의정부시", "파주시", "시흥시", "김포시", "광명시", "광주시",
    "군포시", "이천시", "오산시", "하남시", "양주시", "구리시", "안성시", "포천시",
    "의왕시", "여주시", "양평군", "동두천시", "과천시", "가평군", "연천군"
  ],
  "인천광역시": [
    "중구", "동구", "미추홀구", "연수구", "남동구", "부평구", "계양구", "서구", "강화군", "옹진군"
  ],
  "부산광역시": [
    "중구", "서구", "동구", "영도구", "부산진구", "동래구", "남구", "북구",
    "해운대구", "사하구", "금정구", "강서구", "연제구", "수영구", "사상구", "기장군"
  ],
  "대구광역시": [
    "중구", "동구", "서구", "남구", "북구", "수성구", "달서구", "달성군", "군위군"
  ],
  "광주광역시": [
    "동구", "서구", "남구", "북구", "광산구"
  ],
  "대전광역시": [
    "동구", "중구", "서구", "유성구", "대덕구"
  ],
  "울산광역시": [
    "중구", "남구", "동구", "북구", "울주군"
  ],
  "세종특별자치시": [
    "세종시 전역"
  ],
  "강원특별자치도": [
    "춘천시", "원주시", "강릉시", "동해시", "태백시", "속초시", "삼척시", "홍천군",
    "횡성군", "영월군", "평창군", "정선군", "철원군", "화천군", "양구군", "인제군", "고성군", "양양군"
  ],
  "충청북도": [
    "청주시", "충주시", "제천시", "보은군", "옥천군", "영동군", "증평군", "진천군", "괴산군", "음성군", "단양군"
  ],
  "충청남도": [
    "천안시", "공주시", "보령시", "아산시", "서산시", "논산시", "계룡시", "당진시",
    "금산군", "부여군", "서천군", "청양군", "홍성군", "예산군", "태안군"
  ],
  "전북특별자치도": [
    "전주시", "군산시", "익산시", "정읍시", "남원시", "김제시", "완주군", "진안군", "무주군", "장수군", "임실군", "순창군", "고창군", "부안군"
  ],
  "전라남도": [
    "목포시", "여수시", "순천시", "나주시", "광양시", "담양군", "곡성군", "구례군", "고흥군", "보성군", "화순군", "장흥군", "강진군", "해남군", "영암군", "무안군", "함평군", "영광군", "장성군", "완도군", "진도군", "신안군"
  ],
  "경상북도": [
    "포항시", "경주시", "김천시", "안동시", "구미시", "영주시", "영천시", "상주시", "문경시", "경산시", "의성군", "청송군", "영양군", "영덕군", "청도군", "고령군", "성주군", "칠곡군", "예천군", "봉화군", "울진군", "울릉군"
  ],
  "경상남도": [
    "창원시", "진주시", "통영시", "사천시", "김해시", "밀양시", "거제시", "양산시", "의령군", "함안군", "창녕군", "고성군", "남해군", "하동군", "산청군", "함양군", "거창군", "합천군"
  ],
  "제주특별자치도": [
    "제주시", "서귀포시"
  ]
};

// 서울 주요 자치구와 맞닿아 있는 연접 시·군 매핑 (2순위 판정 로직에 사용)
const ADJACENT_REGIONS = {
  "강남구": ["성남시", "과천시"],
  "서초구": ["과천시", "성남시", "의왕시"],
  "송파구": ["성남시", "하남시"],
  "강동구": ["하남시", "구리시", "남양주시"],
  "광진구": ["구리시"],
  "중랑구": ["구리시", "남양주시"],
  "노원구": ["의정부시", "남양주시"],
  "도봉구": ["의정부시", "양주시"],
  "강북구": ["양주시"],
  "은평구": ["고양시"],
  "마포구": ["고양시"],
  "강서구": ["김포시", "부천시", "계양구"],
  "양천구": ["부천시"],
  "구로구": ["광명시", "부천시"],
  "금천구": ["안양시", "광명시"],
  "관악구": ["안양시", "과천시"],
  "동작구": ["과천시"]
};

/**
 * 거주지, 직장/학교 소재지와 희망 공급 지역 간의 청약 순위 판정 함수
 */
function evaluateRegionalPriority(userSido, userGugun, workSido, workGugun, targetSido, targetGugun) {
  if (!userSido || !targetSido) {
    return {
      priority: 0,
      rankText: "지역을 선택해주세요",
      badgeColor: "bg-slate-100 text-slate-600 border-slate-300",
      description: "현재 거주지와 희망 지역을 선택하면 신청 가능 순위가 계산됩니다."
    };
  }

  // 1. 해당 자치구/시/군 일치 여부 확인 (최우선 1순위)
  const isDirectResidenceMatch = (userSido === targetSido && (!targetGugun || userGugun === targetGugun));
  const isDirectWorkMatch = (workSido && workGugun && workSido === targetSido && (!targetGugun || workGugun === targetGugun));

  if (isDirectResidenceMatch || isDirectWorkMatch) {
    let basis = "";
    if (isDirectResidenceMatch && isDirectWorkMatch) {
      basis = "주민등록 거주지 및 직장(학교) 모두 소재";
    } else if (isDirectResidenceMatch) {
      basis = "주민등록상 거주지 일치";
    } else {
      basis = "직장 또는 학교 소재지 일치";
    }

    return {
      priority: 1,
      rankText: "1순위 (최우선 공급 대상)",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
      description: `희망 지역 [${targetSido} ${targetGugun || '전체'}] 관내에 ${basis}하여 최우선 1순위로 신청 가능합니다.`
    };
  }

  // 2. 동일 시·도(광역자치단체) 관내 여부 확인
  const isSameSidoResidence = (userSido === targetSido);
  const isSameSidoWork = (workSido && workSido === targetSido);

  if (isSameSidoResidence || isSameSidoWork) {
    if (targetSido === "서울특별시") {
      return {
        priority: 1,
        rankText: "1순위 (서울시 관내 배정)",
        badgeColor: "bg-teal-100 text-teal-800 border-teal-300",
        description: `서울시 관내 거주/직장 자격으로 서울시 전체 공고에 1순위 지원이 가능합니다. (해당 자치구 거주자 우선 배점 존재 가능)`
      };
    }

    return {
      priority: 2,
      rankText: "1~2순위 (동일 시·도 관내)",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
      description: `동일한 [${targetSido}] 관내에 거주/직장이 있어, 공급 유형(광역/기초)에 따라 1순위 또는 2순위로 안정적으로 청약 가능합니다.`
    };
  }

  // 3. 연접 시·군·구 확인 (서울<->경기 인접 지역 등)
  let isAdjacent = false;
  if (targetGugun && ADJACENT_REGIONS[targetGugun]) {
    if (ADJACENT_REGIONS[targetGugun].includes(userGugun) || (workGugun && ADJACENT_REGIONS[targetGugun].includes(workGugun))) {
      isAdjacent = true;
    }
  }
  if (userGugun && ADJACENT_REGIONS[userGugun] && ADJACENT_REGIONS[userGugun].includes(targetGugun)) {
    isAdjacent = true;
  }

  if (isAdjacent) {
    return {
      priority: 2,
      rankText: "2순위 (연접 시·군·구)",
      badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-300",
      description: `희망 지역 [${targetSido} ${targetGugun}]과 현재 거주/직장지가 맞닿아 있는 연접 지역으로 2순위 신청 자격이 부여됩니다.`
    };
  }

  // 4. 수도권 상호 지원 (서울/경기/인천 간)
  const isSudogwon = (sido) => ["서울특별시", "경기도", "인천광역시"].includes(sido);
  if (isSudogwon(userSido) && isSudogwon(targetSido)) {
    return {
      priority: 3,
      rankText: "2~3순위 (수도권 광역)",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
      description: `동일 수도권(서울·경기·인천) 생활권으로, 전국/수도권 통합 일반공급 유형에 청약 가능합니다.`
    };
  }

  // 5. 기타 관외 지역
  return {
    priority: 4,
    rankText: "3순위 (기타 관외 지역)",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-300",
    description: `해당 지역 외 전국 거주자 자격으로 지원 가능합니다. (전국 대상 행복주택 및 미달·잔여세대 공고 청약 가능)`
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { KOREA_REGIONS, ADJACENT_REGIONS, evaluateRegionalPriority };
}

