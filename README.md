# RC2000 Intake Lab

A standalone QMODSIM project inspired by Reading Club 2000's donation and inquiry pages. Unzip the submission and open **index.html** in Edge, Chrome, or Firefox. Keep the folder contents together. A static HTTP server enables background Monte Carlo processing via a Web Worker. Opening the file directly uses the same calculation on the main thread.

## Demonstration

1. Open **Scenarios** and select **Suspicious submission spike**. Compare stronger screening with adding desks. Screening lowers modeled incident loss but slows reviews.
2. Open the selected response in **Lab**. Change the number of volunteers and watch the wait, blocking estimate, and animated intake queue.
3. Open **Verify model** for ten reproducible checks. The drawer uses benchmark fixtures. Its results establish mathematical consistency under the stated assumptions.
4. Open **Codex** to explain the formulas and limitations.

| Reading Club 2000 workflow | QMODSIM topic | Demonstration |
| --- | --- | --- |
| Donation and inquiry arrivals | Modules 1 & 3, setup and stochastic processes | Poisson arrivals and exponential inter-arrival times |
| Volunteer review and intake limits | Module 6, queueing | M/M/c/K, blocking, throughput, Little's Law |
| Suspicious submission screening | Module 5, Markov processes | New, Review, Missed, Held |
| Hypothetical recovery costs | Module 4, Monte Carlo | Seeded annual loss expectancy and 95th percentile |
| Synthetic intake reference | Modules 2 & 10, security and entropy | Uniform keyspace, entropy and rate-limit assumptions |
| Random review policy | Module 7, game theory | Payoff matrix and mixed-strategy indifference |
| Form volume spikes | Module 11, anomaly detection | Six-window Z-score, threshold controls and replay |
| Submission form uptime | Module 12, reliability | Single-host versus redundant-host availability |

## Project files

- [Project proposal](PROPOSAL.md)
- [Specification](SPEC.md)
- [Design system](DESIGN_SYSTEM.md)
- [AI usage and release notes](AI_USAGE.md)
- Run `node test.cjs` for automated engine checks.

Team roster and adviser details are pending. This package is a local submission. Any future course-required deployment can use a separate static host and repository.



