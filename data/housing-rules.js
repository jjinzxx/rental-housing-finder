// 대한민국 공공임대주택 정책 기준 및 소득/자산 가이드라인 (2024~2026 최신 기준)

// 가구원 수별 도시근로자 월평균소득 기준표 (단위: 만원)
// 1인 가구(+20%p), 2인 가구(+10%p) 법정 완화 기준 반영
const INCOME_STANDARDS = {
  1: { 50: 246, 70: 301, 100: 348, 120: 418, 140: 488, 150: 522 },
  2: { 50: 304, 70: 401, 100: 532, 120: 638, 140: 745, 150: 798 },
  3: { 50: 360, 70: 503, 100: 719, 120: 863, 140: 1007, 150: 1079 },
  4: { 50: 412, 70: 577, 100: 824, 120: 989, 140: 1154, 150: 1236 },
  5: { 50: 439, 70: 614, 100: 877, 120: 1052, 140: 1228, 150: 1316 }
};

// 차량가액 및 자산 상한 기준 (2024~2026 공통)
const ASSET_LIMITS = {
  carValueLimit: 3708, // 만원 (약 3,708만원 이하)
  youthAssetLimit: 27300, // 만원 (청년 2억 7,300만원 이하)
  generalAssetLimit: 34500 // 만원 (일반/신혼 3억 4,500만원 이하)
};

// 임대주택 유형별 상세 데이터 및 자격 판정 룰
const HOUSING_TYPES = [
  {
    id: "happy-housing",
    name: "행복주택",
    targetCategory: ["youth", "student", "newlywed", "senior", "vulnerable"],
    maxIncomeRatio: 100, // 맞벌이 신혼은 120%
    assetLimitType: "category", // 계층별 상이
    requireCarCheck: true,
    requireHomeless: true,
    requireSubscriptionBank: true, // 청약통장 필요
    rentRate: "주변 시세의 60% ~ 80%",
    stayPeriod: "청년 6년(유자녀 10년), 신혼 6~10년, 고령자 20년",
    features: [
      "직주근접(대중교통 편리한 도심/역세권) 공급 위주",
      "빌트인 가구(냉장고, 가스쿡탑, 책상 등) 기본 제공(청년/대학생형)",
      "보증금 대출 버팀목 전세자금대출 연계 가능"
    ],
    officialSites: ["LH 청약플러스", "SH 서울주택도시공사", "GH 경기주택도시공사", "마이홈"],
    description: "청년·대학생·신혼부부 등 젊은 계층의 주거안정을 위해 직장과 학교가 가까운 곳에 짓는 저렴한 공공임대주택입니다."
  },
  {
    id: "youth-purchase",
    name: "청년 매입임대 / 기숙사형 주택",
    targetCategory: ["youth", "student"],
    maxIncomeRatio: 100,
    assetLimitType: "youth",
    requireCarCheck: true, // 차량 미소유 원칙 (생계형 제외)
    requireHomeless: true,
    requireSubscriptionBank: false, // 청약통장 무관
    rentRate: "주변 시세의 40% ~ 50% (매우 저렴)",
    stayPeriod: "최장 10년 (2년 단위 재계약)",
    features: [
      "기존 신축 빌라/오피스텔을 LH/SH가 매입하여 공급",
      "에어컨, 세탁기, 냉장고 등 풀옵션 빌트인 완비",
      "청약통장 납입 횟수와 무관하게 소득 및 지역 순위로 선발"
    ],
    officialSites: ["LH 청약플러스", "SH 서울주택도시공사", "마이홈"],
    description: "도심 내 기존 주택을 공공이 매입하여 시세의 40~50% 수준으로 저렴하게 공급하는 풀옵션 청년 원룸·오피스텔형 주택입니다."
  },
  {
    id: "seoul-youth-safe",
    name: "서울 청년안심주택 (구 역세권 청년주택)",
    targetCategory: ["youth", "newlywed"],
    maxIncomeRatio: 120, // 공공 100%, 민간특별 120%, 일반 무관
    assetLimitType: "youth",
    requireCarCheck: true, // 차량 미소유(생업용/장애인 제외)
    requireHomeless: true,
    requireSubscriptionBank: false,
    rentRate: "공공임대 시세 30~50%, 민간지원 시세 75~85%",
    stayPeriod: "최장 8년 ~ 10년",
    features: [
      "서울 지하철역 반경 350m 이내 초역세권 입지",
      "커뮤니티 시설(피트니스, 북카페, 스터디룸, 공유세탁실) 특화",
      "서울시 임차보증금 무이자 지원 혜택 연계"
    ],
    officialSites: ["청년안심주택 종합지원센터", "SH 서울주택도시공사"],
    description: "서울 역세권에 대중교통이 편리하고 청년 맞춤형 커뮤니티를 갖춘 공공 및 민간 지원 임대주택입니다."
  },
  {
    id: "national-rental",
    name: "국민임대주택",
    targetCategory: ["general", "newlywed", "senior", "vulnerable", "multi-child"],
    maxIncomeRatio: 70, // 월평균소득 70% 이하 (50% 이하 우선공급)
    assetLimitType: "general",
    requireCarCheck: true,
    requireHomeless: true,
    requireSubscriptionBank: true,
    rentRate: "주변 시세의 60% ~ 80%",
    stayPeriod: "최장 30년 (2년 단위 재계약)",
    features: [
      "장기적이고 안정적인 주거 보장 (최장 30년)",
      "전용 29㎡, 36㎡, 46㎡, 51㎡, 59㎡ 등 다양한 중소형 평형",
      "해당 시·군·구 거주 기간이 길수록 높은 가점 확보"
    ],
    officialSites: ["LH 청약플러스", "SH 서울주택도시공사", "GH 경기주택도시공사", "마이홈"],
    description: "무주택 저소득 서민의 주거 안정을 위해 30년 동안 안정적으로 거주할 수 있는 장기 공공임대주택입니다."
  },
  {
    id: "integrated-public",
    name: "통합공공임대주택",
    targetCategory: ["youth", "student", "newlywed", "senior", "general", "multi-child", "vulnerable"],
    maxIncomeRatio: 150, // 중위소득 150% 이하 폭넓은 입주 허용
    assetLimitType: "general",
    requireCarCheck: true,
    requireHomeless: true,
    requireSubscriptionBank: true,
    rentRate: "소득 수준에 따라 시세 35% ~ 90% 슬라이딩 차등 부과",
    stayPeriod: "청년 6년, 신혼 10년, 다자녀·고령자 30년",
    features: [
      "영구임대+국민임대+행복주택을 하나로 통합한 신규 유형",
      "중위소득 150%까지 자격이 대폭 완화되어 중산층 청년/신혼도 신청 가능",
      "소득 수준에 맞춘 합리적인 임대료 자동 산출"
    ],
    officialSites: ["LH 청약플러스", "마이홈"],
    description: "행복주택과 국민임대를 통합하여 중위소득 150% 이하까지 폭넓게 입주 기회를 제공하는 차세대 공공임대입니다."
  },
  {
    id: "longterm-jeonse",
    name: "장기전세주택 (SH 시프트 등)",
    targetCategory: ["general", "newlywed", "multi-child"],
    maxIncomeRatio: 150, // 전용면적별 100~150% 이하
    assetLimitType: "general",
    requireCarCheck: true,
    requireHomeless: true,
    requireSubscriptionBank: true,
    rentRate: "주변 전세 시세의 80% 이하 (월세 없는 올전세)",
    stayPeriod: "최장 20년",
    features: [
      "매달 나가는 월세 없이 보증금만으로 거주하는 전세형 임대",
      "중대형 평형(59㎡, 84㎡) 공급이 많아 가족 단위 선호도 최상",
      "최장 20년 동안 내 집처럼 안정적인 거주 가능"
    ],
    officialSites: ["SH 서울주택도시공사", "GH 경기주택도시공사"],
    description: "월세 부담 없이 주변 전세 시세의 80% 이하로 최장 20년 동안 전세로 살 수 있는 공공 전세주택입니다."
  },
  {
    id: "public-private-rental",
    name: "공공지원 민간임대주택",
    targetCategory: ["youth", "newlywed", "general", "senior"],
    maxIncomeRatio: 999, // 일반공급은 소득 무관
    assetLimitType: "none",
    requireCarCheck: false,
    requireHomeless: true, // 무주택자 기준
    requireSubscriptionBank: false,
    rentRate: "일반 시세 95% 이하, 청년/신혼 특별공급 시세 75~85%",
    stayPeriod: "최장 10년 (2년마다 5% 이내 임대료 증액 제한)",
    features: [
      "소득·자산 요건이 까다롭지 않아 소득 기준 초과자에게 최적의 대안",
      "대형 브랜드 건설사(자이, 래미안, 힐스테이트 등) 아파트 단지 입주",
      "10년간 이사 걱정 없이 안정적인 거주 보장"
    ],
    officialSites: ["청약홈 (한국부동산원)", "마이홈"],
    description: "민간 건설사가 짓고 공공이 지원하여 소득·자산 기준에 구애받지 않고 최대 10년 거주할 수 있는 브랜드 아파트입니다."
  }
];

// 공식 임대주택 확인 및 청약 사이트 메타데이터 (다이렉트 링크 생성용)
const OFFICIAL_PLATFORMS = [
  {
    id: "myhome",
    name: "마이홈 포털 (국토교통부·LH)",
    badge: "전국 통합 조회",
    tagline: "전국 공공임대주택 입주자 자가진단 및 공고 종합 포털",
    url: "https://www.myhome.go.kr/",
    noticeUrl: "https://www.myhome.go.kr/hws/portal/sch/selectRsdtRcritNtcView.do",
    diagnosisUrl: "https://www.myhome.go.kr/hws/portal/dgn/selectSelfDgnInsttView.do",
    features: "전국 모든 지자체 및 공공기관의 임대주택 공고를 한곳에서 검색하고 맞춤형 자가진단을 제공합니다."
  },
  {
    id: "lh",
    name: "LH 청약플러스 (한국토지주택공사)",
    badge: "전국 최대 공급",
    tagline: "전국 행복주택, 국민임대, 매입임대, 통합공공임대 공식 청약 시스템",
    url: "https://apply.lh.or.kr/",
    noticeUrl: "https://apply.lh.or.kr/lhapply/apply/wt/wrtanc/selectWrtancList.do",
    features: "대한민국 최대 공급 기관인 LH의 전국 단위 모든 임대주택 분양·임대 공고문 및 인터넷 청약 신청 창구입니다."
  },
  {
    id: "sh",
    name: "SH 서울주택도시공사 인터넷청약",
    badge: "서울 전역 공급",
    tagline: "서울시 관내 행복주택, 장기전세, 역세권 청년주택, 국민임대",
    url: "https://www.i-sh.co.kr/app/index.do",
    noticeUrl: "https://www.i-sh.co.kr/main/lay2/program/S1T294C297/www/brd/m_247/list.do",
    features: "서울특별시 관내에서 공급되는 SH 공공임대주택, 장기전세(Shift), 매입임대의 단독 청약 센터입니다."
  },
  {
    id: "gh",
    name: "GH 경기주택도시공사 청약센터",
    badge: "경기도 전역 공급",
    tagline: "경기도 관내 행복주택, 국민임대, 기본주택 공고 및 청약",
    url: "https://apply.gh.or.kr/",
    noticeUrl: "https://apply.gh.or.kr/co/coa/selectRcritPblancList.do",
    features: "판교, 광교, 다산, 고양 등 경기도 핵심 개발지구 내 GH 공공임대주택 공급 공고를 전담합니다."
  },
  {
    id: "seoul-youth-housing",
    name: "서울 청년안심주택 종합지원센터",
    badge: "서울 초역세권",
    tagline: "서울 지하철 역세권 350m 이내 청년·신혼 전용 공공/민간 임대",
    url: "https://soco.seoul.go.kr/youth/main/main.do",
    noticeUrl: "https://soco.seoul.go.kr/youth/bbs/BMSR00015/list.do?menuNo=400008",
    features: "서울시 전역 역세권 청년안심주택의 단지별 실시간 입주자 모집 공고와 보증금 무이자 지원을 안내합니다."
  },
  {
    id: "applyhome",
    name: "청약홈 (한국부동산원)",
    badge: "공공지원 민간임대",
    tagline: "소득 요건 완화된 공공지원 민간임대 및 일반 청약",
    url: "https://www.applyhome.co.kr/",
    noticeUrl: "https://www.applyhome.co.kr/ai/aia/selectAPTLttotPblancListView.do",
    features: "소득이나 자산 기준이 높아 공공임대 진입이 어려운 분들을 위한 고품질 공공지원 민간임대 공고를 제공합니다."
  }
];

// 기준 날짜를 기반으로 실시간 신청 가능 공고 목록 생성 함수
function getDynamicAnnouncements(baseDate = new Date()) {
  const formatDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  const addDays = (d, days) => {
    const result = new Date(d);
    result.setDate(result.getDate() + days);
    return result;
  };

  const items = [
    {
      id: "ANC-001",
      sido: "서울특별시",
      gugun: "강남구",
      title: "2026년 서울 강남 수서 A3블록 역세권 행복주택 입주자 모집",
      housingType: "행복주택",
      typeId: "happy-housing",
      agency: "LH 청약플러스",
      target: ["youth", "newlywed", "student", "senior"],
      scale: "총 199세대 (전용 14㎡, 26㎡, 44㎡)",
      startOffset: -3, // 3일 전 시작
      endOffset: 5,    // 5일 후 마감
      deposit: "보증금 4,200만 ~ 1억 1,000만 원",
      monthlyRent: "월 15만 ~ 38만 원",
      link: "https://apply.lh.or.kr/"
    },
    {
      id: "ANC-002",
      sido: "서울특별시",
      gugun: "마포구",
      title: "마포 서교동 청년안심주택(역세권) 입주자 모집공고",
      housingType: "서울 청년안심주택 (구 역세권 청년주택)",
      typeId: "seoul-youth-safe",
      agency: "서울 청년안심주택",
      target: ["youth", "student"],
      scale: "총 320세대 (풀옵션 빌트인 원룸)",
      startOffset: -5,
      endOffset: 3, // D-3 마감 임박
      deposit: "보증금 3,000만 ~ 6,500만 원 (서울시 무이자 대출)",
      monthlyRent: "월 18만 ~ 35만 원",
      link: "https://soco.seoul.go.kr/youth/main/main.do"
    },
    {
      id: "ANC-003",
      sido: "서울특별시",
      gugun: "송파구",
      title: "제1차 송파 위례지구 장기전세주택(Shift) 입주자 모집",
      housingType: "장기전세주택 (SH 시프트 등)",
      typeId: "longterm-jeonse",
      agency: "SH 서울주택도시공사",
      target: ["newlywed", "general", "multi-child"],
      scale: "총 150세대 (전용 59㎡, 84㎡ 올전세)",
      startOffset: -1,
      endOffset: 8,
      deposit: "전세보증금 3억 2,000만 ~ 4억 5,000만 원",
      monthlyRent: "월 0원 (올전세)",
      link: "https://www.i-sh.co.kr/app/index.do"
    },
    {
      id: "ANC-004",
      sido: "경기도",
      gugun: "성남시",
      title: "성남 판교 제2테크노밸리 청년·창업인 행복주택 모집",
      housingType: "행복주택",
      typeId: "happy-housing",
      agency: "LH 청약플러스",
      target: ["youth", "student"],
      scale: "총 200세대 (전용 21㎡, 36㎡)",
      startOffset: -2,
      endOffset: 6,
      deposit: "보증금 3,500만 ~ 6,800만 원",
      monthlyRent: "월 14만 ~ 26만 원",
      link: "https://apply.lh.or.kr/"
    },
    {
      id: "ANC-005",
      sido: "경기도",
      gugun: "수원시",
      title: "수원 광교 경기행복주택 잔여세대 입주자 모집공고",
      housingType: "행복주택",
      typeId: "happy-housing",
      agency: "GH 경기주택도시공사",
      target: ["youth", "newlywed", "senior"],
      scale: "총 85세대",
      startOffset: -4,
      endOffset: 4,
      deposit: "보증금 4,000만 ~ 7,500만 원",
      monthlyRent: "월 16만 ~ 30만 원",
      link: "https://apply.gh.or.kr/"
    },
    {
      id: "ANC-006",
      sido: "경기도",
      gugun: "고양시",
      title: "고양 삼송·지축 국민임대주택 예비입주자 모집",
      housingType: "국민임대주택",
      typeId: "national-rental",
      agency: "LH 청약플러스",
      target: ["general", "senior", "multi-child"],
      scale: "총 140세대",
      startOffset: 2, // 2일 후 시작 (접수예정)
      endOffset: 12,
      deposit: "보증금 2,500만 ~ 5,500만 원",
      monthlyRent: "월 12만 ~ 24만 원",
      link: "https://apply.lh.or.kr/"
    },
    {
      id: "ANC-007",
      sido: "인천광역시",
      gugun: "연수구",
      title: "인천 송도국제도시 공공지원 민간임대아파트 공급",
      housingType: "공공지원 민간임대주택",
      typeId: "public-private-rental",
      agency: "청약홈 (한국부동산원)",
      target: ["youth", "newlywed", "general"],
      scale: "총 800세대 (소득무관 브랜드 대단지)",
      startOffset: -2,
      endOffset: 9,
      deposit: "보증금 1억 5,000만 ~ 2억 2,000만 원",
      monthlyRent: "월 30만 ~ 45만 원",
      link: "https://www.applyhome.co.kr/"
    },
    {
      id: "ANC-008",
      sido: "부산광역시",
      gugun: "해운대구",
      title: "부산 센텀시티 청년 매입임대주택 정기모집",
      housingType: "청년 매입임대 / 기숙사형 주택",
      typeId: "youth-purchase",
      agency: "LH 청약플러스",
      target: ["youth", "student"],
      scale: "총 120실 (풀옵션 원룸)",
      startOffset: -6,
      endOffset: 2, // D-2 마감임박
      deposit: "보증금 100만 ~ 200만 원",
      monthlyRent: "월 12만 ~ 22만 원",
      link: "https://apply.lh.or.kr/"
    },
    {
      id: "ANC-009",
      sido: "서울특별시",
      gugun: "동작구",
      title: "[종료] 서울 상도동 청년주택 입주자 모집 (지난 공고)",
      housingType: "행복주택",
      typeId: "happy-housing",
      agency: "SH 서울주택도시공사",
      target: ["youth"],
      scale: "총 80세대",
      startOffset: -20,
      endOffset: -5, // 5일 전 마감됨
      deposit: "보증금 3,000만 원",
      monthlyRent: "월 20만 원",
      link: "https://www.i-sh.co.kr/app/index.do"
    }
  ];

  return items.map((item) => {
    const startDate = addDays(baseDate, item.startOffset);
    const endDate = addDays(baseDate, item.endOffset);
    const nowTime = baseDate.getTime();
    const startTime = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
    const endTime = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59).getTime();

    let status = "접수중";
    let statusBadge = "bg-emerald-100 text-emerald-800 border-emerald-300";
    let isApplyable = true;
    let dDayText = "";

    if (nowTime < startTime) {
      status = "접수예정";
      statusBadge = "bg-amber-100 text-amber-800 border-amber-300";
      isApplyable = true;
      const diffDays = Math.ceil((startTime - nowTime) / (1000 * 60 * 60 * 24));
      dDayText = `D-${diffDays}일 후 접수시작`;
    } else if (nowTime > endTime) {
      status = "마감됨";
      statusBadge = "bg-slate-100 text-slate-500 border-slate-300";
      isApplyable = false;
      dDayText = "접수종료";
    } else {
      status = "접수중";
      statusBadge = "bg-emerald-100 text-emerald-800 border-emerald-300";
      isApplyable = true;
      const remainDays = Math.ceil((endTime - nowTime) / (1000 * 60 * 60 * 24));
      dDayText = remainDays <= 3 ? `🔥 D-${remainDays}일 (마감임박)` : `D-${remainDays}일 남음`;
    }

    return {
      ...item,
      period: `${formatDate(startDate)} ~ ${formatDate(endDate)}`,
      startDateStr: formatDate(startDate),
      endDateStr: formatDate(endDate),
      status,
      statusBadge,
      isApplyable,
      dDayText
    };
  });
}

const MOCK_ANNOUNCEMENTS = getDynamicAnnouncements();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { INCOME_STANDARDS, ASSET_LIMITS, HOUSING_TYPES, OFFICIAL_PLATFORMS, MOCK_ANNOUNCEMENTS };
}

