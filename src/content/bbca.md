---
ticker: BBCA
companyName: Bank Central Asia Tbk
logoDomain: bca.co.id
sector: Banking
dateAnalyzed: 2026-06-06
visibility: public
title: Indonesia's Premier Franchise Bank
subtitle: CASA dominance and best-in-class asset quality make BBCA a compounding machine
metrics:
  # THIRD PARTY FUND (DPK)
  - id: dpk
    label: Third Party Fund
    type: bar
    unit: 'Rp(Tn)'
    data:
      - { year: 2015, value: 474 }
      - { year: 2016, value: 530 }
      - { year: 2017, value: 581 }
      - { year: 2018, value: 630 }
      - { year: 2019, value: 705 }
      - { year: 2020, value: 841 }
      - { year: 2021, value: 976 }
      - { year: 2022, value: 1040 }
      - { year: 2023, value: 1102 }
      - { year: 2024, value: 1134 }
      - { year: 2025, value: 1249 }

  # CASA RATIO
  - id: casa_ratio
    label: CASA Ratio
    type: area
    unit: '%'
    dualWith: casa
    formula: "casa / dpk * 100"
  
  # CASA STACK DEPOSIT
  - id: casa_stack_deposit
    label: DPK Composition
    type: bar
    unit: 'Rp(Tn)'
    stackWith: [casa, time_deposit]

  # CASA
  - id: casa
    label: CASA
    type: area
    unit: 'Rp(Tn)'
    data:
      - { year: 2015, value: 361 }
      - { year: 2016, value: 408 }
      - { year: 2017, value: 443 }
      - { year: 2018, value: 483 }
      - { year: 2019, value: 532 }
      - { year: 2020, value: 644 }
      - { year: 2021, value: 767 }
      - { year: 2022, value: 848 }
      - { year: 2023, value: 885 }
      - { year: 2024, value: 924 }
      - { year: 2025, value: 1045 }
      # 2021
      - { period: "Q1 2021", value: 656 }
      - { period: "Q2 2021", value: 697 }
      - { period: "Q3 2021", value: 722 }
      - { period: "Q4 2021", value: 767 }
      # 2022
      - { period: "Q1 2022", value: 798 }
      - { period: "Q2 2022", value: 818 }
      - { period: "Q3 2022", value: 830 }
      - { period: "Q4 2022", value: 848 }
      # 2023 
      - { period: "Q1 2023", value: 843 }
      - { period: "Q2 2023", value: 865 }
      - { period: "Q3 2023", value: 870 }
      - { period: "Q4 2023", value: 885 }
      # 2024
      - { period: "Q1 2024", value: 905 }
      - { period: "Q2 2024", value: 915 }
      - { period: "Q3 2024", value: 915 }
      - { period: "Q4 2024", value: 924 }
      # 2025
      - { period: "Q1 2025", value: 979 }
      - { period: "Q2 2025", value: 982 }
      - { period: "Q3 2025", value: 999 }
      - { period: "Q4 2025", value: 1045 }
      # 2026
      - { period: "Q1 2026", value: 1089 }

  # TIME DEPOSIT RATIO
  - id: time_deposit_ratio
    label: Time Deposit Ratio
    type: area
    unit: '%'
    dualWith: time_deposit
    formula: "time_deposit / dpk * 100"

  # TIME DEPOSIT
  - id: time_deposit
    label: Time Deposit
    type: area
    unit: 'Rp(Tn)'
    data:
      - { year: 2015, value: 108 }
      - { year: 2016, value: 122 }
      - { year: 2017, value: 137 }
      - { year: 2018, value: 147 }
      - { year: 2019, value: 173 }
      - { year: 2020, value: 197 }
      - { year: 2021, value: 209 }
      - { year: 2022, value: 192 }
      - { year: 2023, value: 217 }
      - { year: 2024, value: 210 }
      - { year: 2025, value: 204 }
      # 2021
      - { period: "Q1 2021", value: 194 }
      - { period: "Q2 2021", value: 198 }
      - { period: "Q3 2021", value: 202 }
      - { period: "Q4 2021", value: 209 }
      # 2022
      - { period: "Q1 2022", value: 200 }
      - { period: "Q2 2022", value: 193 }
      - { period: "Q3 2022", value: 195 }
      - { period: "Q4 2022", value: 192 }
      # 2023 
      - { period: "Q1 2023", value: 195 }
      - { period: "Q2 2023", value: 207 }
      - { period: "Q3 2023", value: 219 }
      - { period: "Q4 2023", value: 217 }
      # 2024
      - { period: "Q1 2024", value: 216 }
      - { period: "Q2 2024", value: 210 }
      - { period: "Q3 2024", value: 210 }
      - { period: "Q4 2024", value: 210 }
      # 2025
      - { period: "Q1 2025", value: 214 }
      - { period: "Q2 2025", value: 208 }
      - { period: "Q3 2025", value: 206 }
      - { period: "Q4 2025", value: 204 }
      # 2026
      - { period: "Q1 2026", value: 203 }
  

  # CREDIT / LOAN
  - id: loan_growth_pct
    label: Loan YoY Growth
    type: line
    unit: '%'
    color: 'indigo'
    formula: "yoy(loan_value)"

  - id: loan_value
    label: Loan Value
    type: bar
    unit: 'Rp(Tn)'
    color: 'orange'
    comboWith: loan_growth_pct
    data:
      - { year: 2015, value: 388 }
      - { year: 2016, value: 416 }
      - { year: 2017, value: 468 }
      - { year: 2018, value: 538 }
      - { year: 2019, value: 604 }
      - { year: 2020, value: 589 }
      - { year: 2021, value: 637 }
      - { year: 2022, value: 711 }
      - { year: 2023, value: 810 }
      - { year: 2024, value: 922 }
      - { year: 2025, value: 993 }
      # 2026
---

## Thesis

BBCA is the best-run bank in Indonesia and arguably one of the best franchise banks in Southeast Asia. Its CASA ratio consistently sits above 80% — meaning it funds its loan book almost entirely with low-cost current and savings accounts. This gives it a structural NIM advantage over peers that is nearly impossible to replicate.

The bank's technology infrastructure (myBCA, Sakuku, Halo BCA) has kept it ahead of digital challengers. Transaction volume processed by BCA dwarfs peers — 15M+ daily transactions — and this ecosystem lock-in creates a self-reinforcing loop of deposits.

## CASA Dominance

BBCA's CASA ratio has remained above 75% for the entire decade. This is the single most important competitive advantage in Indonesian banking. CASA = cheap, stable funding. Peers like BMRI and BBRI hover in the 55–65% range.

```dual
percent: casa_ratio
nominal: casa
```

The DPK breakdown shows how CASA dominates the funding mix while time deposits remain a smaller, more expensive slice.

```stack
casa
time_deposit
```

The implication: when rates rise, BBCA's cost of funds barely moves while loan yields reset upward — a structural tailwind to NIM that peers simply cannot match.

## Asset Quality

NPL peaked at 2.4% in 2021 during the COVID restructuring period, but has since normalized sharply — among the lowest in the industry. BCA runs one of the most conservative underwriting standards in Indonesian banking, with a clear focus on quality over volume.

```chart
npl_ratio
```

## Credit Growth

Loan growth has been consistently strong, averaging ~11% per year over the decade. Consumer (mortgage and vehicle) and corporate lending are the main drivers. The 2020 dip was COVID-driven and quickly recovered.

```combo
left: loan_value
right: loan_growth_pct
```

## Profitability

NIM has been under some pressure from the low-rate environment post-COVID but remains structurally high. ROA has expanded to 3.5% in 2024 — a level most regional banks can only dream of — driven by operating leverage and improving credit costs.

```chart
nim
```

```chart
roa
```

## Peer Comparison

BBCA's CASA dominance becomes even clearer when plotted against the other Big 4 banks. BMRI has closed some of the gap via its corporate transaction franchise, but BBCA's 80%+ ratio remains in a class of its own.

```compare
casa_ratio
```

## Key Risks

- **Indonesia macro:** IDR depreciation, commodity cycle dependence, political uncertainty
- **Premium valuation:** 3.5–4x PBV offers limited margin of safety if growth disappoints
- **Fintech:** Disintermediation of low-value transactions could erode fee income over time

## My View

BBCA is a hold-forever type of asset for Indonesian equity exposure. At 3.5x PBV, you're paying a fair price for the best franchise in the market. I would add aggressively on any macro-driven dip that brings it below 3x PBV.
