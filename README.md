# 🏢 대한민국 임대주택 스마트 파인더 (Rental Housing Finder)

> **거주지·직장 기반 청약 순위(1·2순위) 자동 판정 & 공공데이터포털(data.go.kr) 실시간 공고 매일 자동 갱신**  
> 공공데이터포털(data.go.kr)의 LH 실시간 임대주택 공고 OpenAPI와 연동되어, **GitHub Actions를 통해 매일 자정에 자동으로 실제 공고를 수집 및 갱신**하는 완전 자동화 공공주택 안내 서비스입니다.

---

## 🌟 핵심 기능

1. **📍 지역 기반 청약 순위(1·2순위) 실시간 판정**:
   - 현재 거주지, 직장/학교 소재지, 청약 희망 지역을 선택하면 관내 1순위(최우선 공급) 및 연접 2순위 자동 계산
2. **📋 정밀 입주자격 진단 폼**:
   - 청년, 대학생, 신혼부부(맞벌이 소득완화 옵션), 신생아 출산가구, 고령자, 다자녀 계층별 적합도 판정
   - 2024~2026년 기준 가구원수별 월평균소득(50%~150%) 기준표 자동 계산기
   - 자산(2.73억 / 3.45억) 및 자동차가액(3,708만원 이하), 청약통장 납입 횟수 체크
3. **🤖 공공데이터포털 실시간 API & 매일 자정 자동 갱신 (GitHub Actions)**:
   - 별도 서버 비용 없이 매일 밤 한국시간 자정(00:00 KST)에 깃허브가 자동으로 공고를 수집하여 웹사이트에 배포
4. **📅 오늘 날짜 기준 신청 가능한 곳 우선 선별**:
   - D-Day 실시간 계산(`🔥 D-3일 마감임박`, `D-7일 남음`, `접수예정`) 및 마감된 공고 자동 제외

---

## 🤖 공공데이터포털(data.go.kr) 무료 API 키 설정 가이드

본 저장소에는 **GitHub Actions 서버리스 자동 갱신 크론 워크플로우**([`.github/workflows/daily-sync.yml`](.github/workflows/daily-sync.yml))가 탑재되어 있습니다.  
아래 단계에 따라 무료 API 키를 등록해 두시면 매일 자정에 실제 정부 공고가 자동으로 갱신됩니다.

### 1단계: 공공데이터포털에서 무료 API 키 발급받기 (소요시간: 2분)
1. **[공공데이터포털(data.go.kr)](https://www.data.go.kr/)**에 접속하여 회원가입 및 로그인합니다.
2. 검색창에 **`한국토지주택공사_임대주택 분양임대공고문 조회 서비스`**를 검색합니다.
3. 서비스 상세 페이지에서 **[활용신청]** 버튼을 클릭합니다.
4. 활용 목적을 간단히 작성(예: '개인 연구 및 임대주택 확인 웹 서비스')하고 신청하면 **신청 즉시 무료 승인**됩니다.
5. 마이페이지 ➔ **[개발계정]**에서 발급된 **일반 인증키 (Encoding 또는 Decoding)**를 복사합니다.

### 2단계: GitHub Secrets에 API 키 등록하기 (소요시간: 1분)
1. 내 깃허브 저장소([https://github.com/jjinzxx/rental-housing-finder](https://github.com/jjinzxx/rental-housing-finder))로 이동합니다.
2. 상단 메뉴에서 **Settings** 탭을 클릭합니다.
3. 좌측 사이드바에서 **Secrets and variables** ➔ **Actions**를 클릭합니다.
4. **[New repository secret]** 녹색 버튼을 클릭합니다.
5. 아래와 같이 입력하고 저장합니다:
   - **Name**: `DATA_GO_KR_API_KEY`
   - **Secret**: 1단계에서 복사한 **일반 인증키** 붙여넣기
   - **[Add secret]** 클릭!

### 3단계: 자동 갱신 확인 및 수동 실행
- **매일 자정 자동 갱신**: 매일 밤 한국시간 00:00에 GitHub Actions가 자동으로 실행되어 최신 공고를 가져옵니다.
- **지금 즉시 갱신하고 싶을 때**:
  1. 깃허브 저장소의 **Actions** 탭 클릭
  2. 좌측에서 **`Daily Public Housing Announcement Sync`** 워크플로우 선택
  3. 우측의 **[Run workflow]** 버튼을 누르면 즉시 수집이 시작됩니다.

> [!NOTE]
> API 키를 등록하지 않더라도, 시스템이 오늘 날짜(`new Date()`)에 맞추어 D-Day와 접수 상태를 매일 자동으로 계산하므로 브라우저에서 언제든 정상 작동합니다.

---

## 🏛️ 주요 공식 청약 사이트

| 공식 플랫폼 | 주관 기관 | 주요 공급 주택 | 바로가기 |
| :--- | :--- | :--- | :--- |
| **마이홈 포털** | 국토교통부 · LH | 전국 공공임대 전체 | [myhome.go.kr](https://www.myhome.go.kr/) |
| **LH 청약플러스** | 한국토지주택공사 | 행복주택, 국민임대, 매입임대 | [apply.lh.or.kr](https://apply.lh.or.kr/) |
| **SH 서울주택도시공사** | 서울특별시 | 서울 행복주택, 장기전세(Shift) | [i-sh.co.kr](https://www.i-sh.co.kr/app/index.do) |
| **GH 경기주택도시공사** | 경기도 | 경기행복주택, 기본주택 | [apply.gh.or.kr](https://apply.gh.or.kr/) |
| **서울 청년안심주택** | 서울특별시 | 역세권 청년·신혼 주택 | [soco.seoul.go.kr](https://soco.seoul.go.kr/youth/main/main.do) |
| **청약홈** | 한국부동산원 | 공공지원 민간임대 (소득무관) | [applyhome.co.kr](https://www.applyhome.co.kr/) |

---

## 📁 프로젝트 파일 구조

```
📁 rental-housing-finder/
├── 📁 .github/workflows/
│   └── 📄 daily-sync.yml         # 매일 자정 자동 갱신 GitHub Actions 워크플로우
├── 📁 data/
│   ├── 📄 real-announcements.json# 매일 자정 갱신되는 실제 공고 데이터베이스
│   ├── 📄 regions.js             # 전국 17개 시·도 및 연접 시군구 순위 판정 룰
│   └── 📄 housing-rules.js       # 2024~2026 소득/자산 기준표 및 7대 공공임대 룰
├── 📁 js/
│   └── 📄 app.js                 # 상태 관리, 실시간 D-Day 계산 및 비동기 공고 로더
├── 📁 scripts/
│   └── 📄 sync-announcements.js  # 공공데이터포털(data.go.kr) 실시간 API 수집기
├── 📄 index.html                 # 반응형 웹 UI (완전 단독 실행 지원 번들)
├── 📄 README.md                  # 프로젝트 설명 및 API 키 설정 가이드
└── 📄 .gitignore                 # 깃 제외 목록
```
