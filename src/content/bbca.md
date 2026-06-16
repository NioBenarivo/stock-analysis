---
ticker: BBCA
companyName: Bank Central Asia Tbk
logoDomain: bca.co.id
sector: Banking
dateAnalyzed: 2026-06-06
visibility: public
title: Indonesia's Premier Franchise Bank
subtitle: CASA dominance and best-in-class asset quality make BBCA a compounding machine
metricOverrides:
  - id: loan_segment_corporate
    label: Corporate
    type: bar
    unit: '%'
  - id: loan_segment_commercial
    label: Commercial
    type: bar
    unit: '%'
  - id: loan_segment_sme
    label: SME
    type: bar
    unit: '%'
  - id: loan_segment_consumer
    label: Consumer
    type: bar
    unit: '%'
  - id: loan_segment_composition
    label: Loan Composition by Segment
    type: bar
    unit: '%'
    stackWith:
      - loan_segment_corporate
      - loan_segment_commercial
      - loan_segment_sme
      - loan_segment_consumer
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
npl
```

## Credit Growth

Loan growth has been consistently strong, averaging ~11% per year over the decade. Consumer (mortgage and vehicle) and corporate lending are the main drivers. The 2020 dip was COVID-driven and quickly recovered.

```combo
left: loan
right: loan_growth
```

## Loan Composition by Segment

Corporate has been the dominant and growing segment, rising from 36% in 2015 to 48% in 2025. Starting 2023, BCA began separately reporting SME from Commercial, giving a clearer picture of the mid-market segment.

```stack
loan_segment_corporate
loan_segment_commercial
loan_segment_sme
loan_segment_consumer
note: *2015–2022: SME was reported combined within Commercial. Separated from 2023 onwards.
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
