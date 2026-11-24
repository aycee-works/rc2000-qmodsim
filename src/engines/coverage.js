'use strict';

globalThis.IntakeCoverage = (() => {
  const availability = (mtbf, mttr) => mtbf / (mtbf + mttr);
  function reliability(mtbf, mttr, redundant) {
    const host = availability(mtbf, mttr);
    const upstream = availability(720, 2);
    const hosting = redundant ? 1 - (1 - host) ** 2 : host;
    const system = upstream * hosting;
    return {system, downtime: 8760 * (1 - system)};
  }

  function entropy(alphabet, length, rate) {
    const space = alphabet ** length;
    return {space, bits: Math.log2(space), seconds: (space + 1) / (2 * rate)};
  }

  function deterrence(cost, gain, penalty) {
    return {
      payoffs: [[[-cost, 0], [penalty - cost, -penalty]], [[0, 0], [-gain, gain]]],
      audit: gain / (gain + penalty),
      abuse: cost / (gain + penalty)
    };
  }

  function anomaly(history, count, threshold) {
    const mean = history.reduce((total, value) => total + value, 0) / history.length;
    const variance = history.reduce((total, value) => total + (value - mean) ** 2, 0) / history.length;
    const deviation = Math.sqrt(variance);
    const z = deviation ? Math.abs(count - mean) / deviation : count === mean ? 0 : Infinity;
    return {mean, deviation, z, flagged: z >= threshold};
  }

  function checks() {
    const game = deterrence(100, 300, 200);
    const primary = reliability(100, 5, false);
    const redundant = reliability(100, 5, true);
    const token = entropy(2, 8, 1);
    const auditDifference = -100 + game.abuse * (300 + 200);
    const abusePayoff = (1 - game.audit) * 300 - game.audit * 200;
    return [
      ['Entropy and keyspace', '8 bits, 256 possibilities and 128.5 seconds', token.bits === 8 && token.space === 256 && token.seconds === 128.5],
      ['Mixed-strategy indifference', 'Neither player gains from switching actions', Math.abs(auditDifference) < 1e-10 && Math.abs(abusePayoff) < 1e-10],
      ['Sliding-window anomaly', 'Normal, spike and zero-variance fixtures', !anomaly([2,4],4,3).flagged && anomaly([2,4],8,3).flagged && anomaly([3,3],9,3).flagged && !anomaly([3,3],3,3).flagged],
      ['Availability and redundancy', 'Independent backup improves availability within upstream limit', primary.system < redundant.system && redundant.system <= availability(720,2)]
    ].map(([name,standard,passed]) => ({name,standard,passed}));
  }

  return {reliability, entropy, deterrence, anomaly, checks};
})();

