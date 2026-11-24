const assert = require('node:assert/strict');
require('./src/engines/model.js');
for (const check of IntakeModel.checks()) {
  console.log(check.name, check.error);
  assert.ok(check.passed, check.name);
}
const params = {lambda: 12, mu: 0.5, desks: 3, capacity: 6};
const desk = IntakeModel.createDesk(params, 22);
const replay = IntakeModel.createDesk(params, 22);
for (let i = 0; i < 1000; i++) {
  const sample = desk.advance(0.25);
  assert.deepEqual(sample, replay.advance(0.25));
  assert.ok(sample.count <= params.capacity && sample.busy <= params.desks);
}
assert.equal(IntakeModel.annualRisk(8, 1, 61).mean, 0);
console.log('Seeded replay, capacity bounds and full containment passed.');


require('./src/engines/coverage.js');
for (const check of IntakeCoverage.checks()) {
  assert.ok(check.passed, check.name);
  console.log(check.name + ' passed.');
}
