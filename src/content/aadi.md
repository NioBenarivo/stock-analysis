---
ticker: AADI
companyName: Adaro Andalan Indonesia Tbk
logoDomain: adaro.com
sector: Coal Mining
dateAnalyzed: 2026-06-06
visibility: private
title: Low-Cost Thermal Coal with a Fortress Balance Sheet
subtitle: High-calorific Kalimantan coal, disciplined capex, and a growing cash pile
metrics:
  - id: coal_production_volume
    label: Production Volume (Mt)
    type: bar
    unit: ' Mt'
    data:
      - { year: 2019, value: 54.5 }
      - { year: 2020, value: 52.1 }
      - { year: 2021, value: 55.8 }
      - { year: 2022, value: 57.3 }
      - { year: 2023, value: 58.9 }
      - { year: 2024, value: 61.2 }
  - id: coal_asp
    label: Average Selling Price (USD/t)
    type: line
    unit: ' USD/t'
    data:
      - { year: 2019, value: 61.4 }
      - { year: 2020, value: 52.8 }
      - { year: 2021, value: 75.3 }
      - { year: 2022, value: 136.7 }
      - { year: 2023, value: 98.4 }
      - { year: 2024, value: 88.1 }
  - id: coal_capacity
    label: Operational Capacity (Mt)
    type: area
    unit: ' Mt'
    data:
      - { year: 2019, value: 60.0 }
      - { year: 2020, value: 60.0 }
      - { year: 2021, value: 62.0 }
      - { year: 2022, value: 65.0 }
      - { year: 2023, value: 65.0 }
      - { year: 2024, value: 68.0 }
---

## Thesis

AADI operates one of the lowest-cost thermal coal mines in Kalimantan. Its sub-bituminous coal (3,800–5,000 kcal/kg GAR) targets the Indian and Southeast Asian power market — customers who need affordable energy, not premium coking coal. The business model is simple: high volume, low strip ratio, and a balance sheet with net cash.

## Operational Overview

Production, ASP, and capacity tell three different stories that need to be read together. Volume has grown steadily — the business is expanding. ASP is the volatile driver: the 2022 spike was Russia-Ukraine driven and has since normalised. Capacity growing ahead of production signals headroom for volume growth without heavy capex.

```combo
left: coal_production_volume, coal_capacity
right: coal_asp
```

## Key Risks

- **Thermal coal demand:** Long-run structural decline as renewables displace coal in power generation
- **ASP cyclicality:** Revenue is highly sensitive to benchmark coal prices, which AADI cannot control
- **Regulatory:** Indonesian DMO rules require 25% of production sold domestically at capped prices
