'use strict';

(() => {
  const extra = globalThis.IntakeCoverage;
  const find = id => document.getElementById(id);
  const count = new Intl.NumberFormat('en-PH');
  const pct = value => (100 * value).toFixed(2) + '%';
  const number = id => Number(find(id).value);
  const histories = {normal:[5,6,7,6,4,5,6,8,7,6,5,7], surge:[5,6,7,6,4,5,6,8,7,6,5,20]};
  const windowSize = 6;
  let cursor = windowSize;
  let stream = histories.normal;
  let playing = false;

  function updateTelemetry() {
    const threshold = number('threshold');
    const current = stream[cursor];
    const result = extra.anomaly(stream.slice(cursor - windowSize,cursor),current,threshold);
    find('threshold-value').textContent = threshold.toFixed(1);
    find('telemetry-output').textContent =
      'Window ' + (cursor + 1) + ' · ' + current + ' submissions/min · Z ' +
      (Number.isFinite(result.z) ? result.z.toFixed(2) : '∞') + ' · ' + (result.flagged ? 'Flagged' : 'Within threshold');
    const g = graphic('telemetry-chart');
    if (!g) return;
    const {ctx,width,height,color} = g;
    const upper = result.mean + threshold * result.deviation;
    const lower = Math.max(0,result.mean - threshold * result.deviation);
    const max = Math.max(upper,...stream,1);
    const x = index => 14 + index * (width - 28)/(stream.length - 1);
    const y = value => height - 20 - value * (height - 38)/max;
    ctx.strokeStyle = color('gold');
    ctx.setLineDash([5,4]);
    for (const bound of [upper,lower]) {
      ctx.beginPath();
      ctx.moveTo(14,y(bound));
      ctx.lineTo(width - 14,y(bound));
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.strokeStyle = color('accent');
    ctx.beginPath();
    ctx.moveTo(x(0),y(stream[0]));
    for (let i = 1; i <= cursor; i++) ctx.lineTo(x(i),y(stream[i]));
    ctx.stroke();
    ctx.fillStyle = color(result.flagged ? 'gold' : 'accent');
    ctx.beginPath();
    ctx.arc(x(cursor),y(current),4,0,Math.PI * 2);
    ctx.fill();
  }

  function update() {
    const token = extra.entropy(number('alphabet'),number('token-length'),number('guess-limit'));
    find('entropy-output').textContent = token.bits.toFixed(2) + ' bits · ' + count.format(token.space) +
      ' possible references · ' + (token.seconds / 3600).toExponential(2) + ' hours expected';
    const penalty = number('review-penalty');
    const cost = number('audit-cost');
    find('game-payoff').textContent = 'Payoffs (desk, submitter), in points: audit and misuse (' +
      (penalty - cost) + ', −' + penalty + '); audit and genuine (−' + cost +
      ', 0); skip and misuse (−300, 300); skip and genuine (0, 0).';
    const game = extra.deterrence(cost,300,penalty);
    find('game-output').textContent = 'Audit probability ' + pct(game.audit) + ' · misuse probability ' + pct(game.abuse);
    const result = extra.reliability(number('host-mtbf'),number('host-mttr'),find('backup-host').checked);
    find('reliability-output').textContent = pct(result.system) + ' modeled uptime · ' +
      result.downtime.toFixed(1) + ' hours/year unavailable';
    updateTelemetry();
  }

  find('coverage-controls').addEventListener('input',update);
  find('telemetry-mode').addEventListener('change', () => {
    stream = histories[find('telemetry-mode').value];
    playing = false;
    cursor = stream.length - 1;
    updateTelemetry();
  });
  find('replay-telemetry').addEventListener('click', () => {
    cursor = windowSize;
    playing = true;
    updateTelemetry();
  });
  setInterval(() => {
    if (!playing || document.hidden || find('lab').hidden) return;
    cursor++;
    playing = cursor < stream.length - 1;
    updateTelemetry();
  },600);
  window.addEventListener('hashchange',update);
  window.addEventListener('resize',updateTelemetry);
  find('theme').addEventListener('click',updateTelemetry);
  update();
})();

