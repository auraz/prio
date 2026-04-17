# TODOS

## V2: Pattern Analysis from History Data

**What:** Surface decision-making patterns from 90-day history data. Show most-overridden framework, work vs personal alignment rates, streak trends.

**Why:** The daily close ritual collects rich data (frameworkPicks, aligned, locked task sphere, retrospective). Without pattern extraction, the user has to mentally analyze raw history. This is the payoff that makes the tool a decision-training system.

**Context:** History schema captures everything needed. Analysis logic is ~50 lines (filter history by timeframe, count overrides per framework, compare work vs personal spheres). Only useful after 7+ days of data. Show "Your Patterns" section at bottom of page, hidden until sufficient data exists.

**Depends on:** V1 daily close + history API must ship first.

**Added:** 2026-04-17 from /plan-eng-review
