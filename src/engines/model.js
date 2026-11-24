'use strict';
globalThis.IntakeModel = (() => {
  function rng(seed) {
    let state = seed >>> 0;
    return () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return (state + 0.5) / 4294967296;
    };
  }

  const exponential = (rate, random) => -Math.log(random()) / rate;

  function queue({lambda, mu, desks, capacity}) {
    const weights = [1];
    for (let n = 1; n <= capacity; n++) {
      weights.push(weights[n - 1] * lambda / (Math.min(n, desks) * mu));
    }
    const total = weights.reduce((a, b) => a + b);
    const probabilities = weights.map(w => w / total);
    const blocked = probabilities[capacity];
    const throughput = lambda * probabilities.slice(0, capacity).reduce((a, b) => a + b, 0);
    const waiting = probabilities.reduce((acc, p, n) => acc + p * Math.max(0, n - desks), 0);
    const busy = probabilities.reduce((acc, p, n) => acc + p * Math.min(n, desks), 0);
    return {probabilities, blocked, throughput, waiting, busy, delay: waiting / throughput};
  }

  function createDesk(params, seed) {
    const random = rng(seed);
    let time = 0;
    let count = 0;
    let nextArrival = exponential(params.lambda, random);
    const desks = Array(params.desks).fill(Infinity);
    function advance(minutes) {
      const end = time + minutes;
      while (true) {
        const departure = Math.min(...desks);
        const event = Math.min(departure, nextArrival);
        if (event > end) break;
        if (nextArrival <= departure) {
          const free = desks.indexOf(Infinity);
          if (count < params.capacity) {
            count++;
            if (free !== -1) desks[free] = event + exponential(params.mu, random);
          }
          nextArrival = event + exponential(params.lambda, random);
        } else {
          count--;
          desks[desks.indexOf(departure)] = count >= params.desks
            ? event + exponential(params.mu, random)
            : Infinity;
        }
      }
      time = end;
      return {time, count, busy: Math.min(count, params.desks)};
    }
    return {advance};
  }

  function chain(containment) {
    return [[0.2, 0.8, 0, 0], [0, 0.25, 0.75 * (1 - containment), 0.75 * containment],
      [0, 0, 1, 0], [0, 0, 0, 1]];
  }

  function transition(distribution, matrix) {
    return matrix.map((_, col) => distribution.reduce((sum, value, row) => sum + value * matrix[row][col], 0));
  }

  function annualRisk(frequency, containment, seed, trials = 10000) {
    const random = rng(seed);
    const losses = new Float64Array(trials);
    let sum = 0;
    const cutoff = Math.exp(-frequency * (1 - containment));
    for (let year = 0; year < trials; year++) {
      let product = random();
      let loss = 0;
      while (product > cutoff) {
        const normal = Math.sqrt(-2 * Math.log(random())) * Math.cos(2 * Math.PI * random());
        loss += 4000 * Math.exp(0.6 * normal);
        product *= random();
      }
      losses[year] = loss;
      sum += loss;
    }
    losses.sort();
    const size = Math.max(1, Math.ceil(losses[trials - 1] / 16));
    const bins = Array(16).fill(0);
    for (const loss of losses) bins[Math.min(15, Math.floor(loss / size))]++;
    return {mean: sum / trials, p95: losses[Math.ceil(trials * 0.95) - 1], bins, size};
  }

  function checks() {
    const random = rng(2026);
    let sum = 0;
    for (let i = 0; i < 50000; i++) sum += exponential(4, random);
    const arrivalError = Math.abs(sum / 50000 * 4 - 1);
    const q = queue({lambda: 1, mu: 1, desks: 1, capacity: 2});
    const littleError = Math.abs(q.waiting - q.throughput * q.delay);
    const numericError = Math.max(Math.abs(q.blocked - 1/3), Math.abs(q.delay - 0.5));
    const overloaded = queue({lambda: 12, mu: 0.5, desks: 1, capacity: 30});
    const flowError = Math.abs(overloaded.throughput - overloaded.busy * 0.5);
    const matrix = chain(0.7);
    const rowError = Math.max(...matrix.map(row => Math.abs(row.reduce((a, b) => a + b) - 1)));
    let distribution = [1, 0, 0, 0];
    for (let step = 0; step < 50; step++) distribution = transition(distribution, matrix);
    const absorptionError = Math.abs(distribution[3] - 0.7);
    const first = annualRisk(8, 0.25, 61);
    const second = annualRisk(8, 0.25, 1992);
    const expected = 6 * 4000 * Math.exp(0.6 ** 2 / 2);
    const riskError = Math.max(Math.abs(first.mean - second.mean), Math.abs(first.mean - expected),
      Math.abs(second.mean - expected)) / expected;
    return [
      ['Poisson inter-arrival mean', 'Relative error ≤ 2%', arrivalError, 0.02],
      ['Little’s Law for waiting jobs', 'Absolute error ≤ 10⁻⁵', littleError, 1e-5],
      ['M/M/1/2 hand calculation', 'Blocking ⅓ and wait 0.5 min', numericError, 1e-10],
      ['Overloaded queue flow balance', 'Arrivals admitted equal service output', flowError, 1e-10],
      ['Markov rows and absorption', 'Rows sum to 1, held mass tends to 0.7', Math.max(rowError, absorptionError), 1e-10],
      ['Monte Carlo convergence', 'Two seeds and analytic mean within 1.5%', riskError, 0.015]
    ].map(([name, standard, error, limit]) => ({name, standard, error, passed: error <= limit}));
  }

  return {queue, createDesk, chain, transition, annualRisk, checks};
})();

