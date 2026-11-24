# AI usage

## Agent and model

OpenAI Codex (GPT-6) drafted the proposal, created the offline browser tool, and ran deterministic tests. A single agent handled the work to keep the model assumptions, implementation, and interaction checks together.

## Skills and security vetting

| Skill or practice | Phase | Scope |
| --- | --- | --- |
| Bundled `pdf:pdf` | Requirements | Read the guides and example proposal through local PDF extraction. |
| Bundled `sites:sites` | Design, implementation, release | Buildless static layout, local packaging, and browser verification workflow. |
| Pure functions, Node assertions, and manual defensive review | Implementation and verification | Bounded controls, analytic fixtures, and a dependency-free runtime. |

The named third-party skill stack and Cloudflare audit were not installed or run. No external skill vetting was claimed. Manual code review checked for unsafe HTML insertion, network requests, form actions, and embedded credentials. UI text is built with textContent and DOM nodes. A Content Security Policy restricts resources to local files and blocks connection and form targets. The random number generator seeds scientific replays.

## Refinements

- Queue arithmetic sums admitted state probabilities directly. Under extreme loading, subtracting a blocking probability rounded close to one can degrade precision. An overloaded fixture checks that admitted arrivals match the service rate.
- Validation checks the simple M/M/1/2 case and overload flow balance alongside Little's Law. Little's Law alone would be satisfied by the formula used to calculate wait.
- The risk model runs against the closed-form mean and two fixed seeds so independent sampling checks more than replayability. A full-containment fixture checks that all losses are zero.

These are implementation decisions supported by tests. No student-authored prompts, failed test history, or human code edits are asserted.

## Attribution and release

Codex generated the standalone HTML, CSS, JavaScript, tests, and submission notes. Add actual student contributions and review history as the team completes them. The local package requires no runtime dependencies. Serving it over HTTP enables the worker path. No GitHub or live deployment is included.


The curriculum coverage update added independent verification fixtures for entropy, payoff indifference, spike detection, and redundancy. The standalone model and browser UI remain separate.
