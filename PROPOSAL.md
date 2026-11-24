# RC2000 Intake Lab
## A quantitative simulation of Reading Club 2000 donation and inquiry intake

**Course** · Quantitative Modeling and Simulation  
**Institution** · University of Makati, College of Computing and Information Sciences  
**Prepared by** · Add your group names and roles  
**Submitted to** · Add your instructor and section

## Chapter 1 · Problem and background

### Introduction

Reading Club 2000's website includes donation and inquiry pages. A public campaign can bring multiple requests to the attention of a small volunteer team at once. The proposed artifact represents those requests as a shared review queue and tests how changes in staffing, capacity, and screening might affect performance.

### Statement of the problem

1. How do peak submission rates change the share of requests that a finite intake desk can accept?
2. How do additional volunteers and a shorter checklist change waits and throughput during a staffing shortage?
3. How does stronger screening trade off review capacity against synthetic incident loss?

### Objectives

Build an interactive standalone browser simulator that lets panelists test three scenarios, compare operational and defensive choices, and verify that the mathematical engines behave as specified. Report blocking probability, mean wait, admitted throughput, screening outcome probabilities, mean annual loss, and the 95th percentile of annual loss.

### Significance

Volunteers and project reviewers can use the simulator to discuss what measurements would be needed before changing an intake workflow. Students can reproduce benchmark results and explain how model inputs drive the findings.

### Scope and delimitations

The modeled shared desk is hypothetical. It uses first-come, first-served reviews, independent Poisson arrivals, exponential service, finite capacity, and a constant arrival rate within each scenario. Contact details, payments, accounts, and production records are outside the model. The annual loss inputs are synthetic and report hypothetical recovery costs in Philippine pesos. Stronger screening changes the probability of containment and the assumed review speed.

## Chapter 2 · Modeling approach and evaluation

| Study question | Method | Evidence |
| --- | --- | --- |
| What happens under peak demand? | Finite M/M/c/K queue and seeded discrete-event replay | Blocking probability, accepted throughput, queue wait |
| What happens to suspicious submissions? | Absorbing Markov chain | Distribution by review step and terminal outcomes |
| How much might missed events cost? | 10,000 synthetic years, Poisson frequency and lognormal severity | Mean and 95th-percentile annual loss |

The three scenarios represent a book drive opening, a Saturday staff shortage, and a suspicious submission spike. Each provides two interventions with computed before-and-after metrics. Validation compares the seeded inter-arrival mean with 1/λ, checks queue predictions against a hand calculation and flow balance, verifies Markov row sums and absorption, and compares Monte Carlo means with the analytic expectation. External validity would require measured arrival and service data from an approved study.


The Lab also evaluates synthetic reference entropy, random-review incentives, rolling-window submission alerts, and form uptime with an independent backup host. These supplementary models use hypothetical inputs and expose their assumptions in Codex.
