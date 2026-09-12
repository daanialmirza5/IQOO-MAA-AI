# MaAI (IQOO-MAA-AI) — Engineering Guide & Mastery Document

## 1. What Is MaAI?
MaAI is an **offline-first mobile maternal risk intelligence app** designed specifically for frontline community healthcare workers (ASHAs and ANMs). Built on React Native and Expo, it provides offline maternal health record keeping, automated obstetric risk assessment heuristics, prenatal visit scheduling, and offline SQLite synchronization.

## 2. Real-World Problem Solved
1. **Paper-Based Register Overload**: Frontline workers carry heavy paper registers, leading to lost records and missed high-risk follow-up visits.
2. **Zero Rural Connectivity**: Deep rural villages have no cellular signal, making web-only apps completely non-functional.
3. **Delayed High-Risk Identification**: Novice community workers miss subtle pre-eclampsia indicators without automated clinical calculation aids.

## 3. High-Level Mobile Architecture
- **Framework**: React Native, Expo, TypeScript, React Navigation.
- **Storage & Offline Persistence**: `expo-sqlite` with local relational tables (`mothers`, `anc_visits`, `vitals`, `risk_alerts`).
- **Core Modules**:
  - `RiskEngine.ts`: Deterministic heuristic scoring evaluating blood pressure thresholds, hemoglobin levels, and gestational age.
  - `OfflineSync.ts`: Delta-sync engine queuing offline modifications and synchronizing with upstream health APIs when network connects.
  - `VisitScheduler.ts`: Automated Ante-Natal Care (ANC) calendar generator computing optimal trimester visit windows.

## 4. Algorithmic Formulations & Risk Heuristics
- **Hypertensive Risk Rule**: If $\text{Systolic} \ge 140 \text{ mmHg}$ or $\text{Diastolic} \ge 90 \text{ mmHg}$, flag `HIGH_RISK_PRE_ECLAMPSIA`.
- **Anemia Risk Rule**: If $\text{Hemoglobin} < 7.0 \text{ g/dL}$, flag `SEVERE_ANEMIA_IMMEDIATE_REFERRAL`.

## 5. Security & Mobile Device Protection
- Local SQLite database PIN protection.
- Minimal on-device PII retention with biometric lock support.
