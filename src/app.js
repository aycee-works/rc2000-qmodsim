'use strict';
const model = globalThis.IntakeModel;
const $ = id => document.getElementById(id);
const money = new Intl.NumberFormat('en-PH', {style:'currency', currency:'PHP', maximumFractionDigits:0});
const percent = value => (value * 100).toFixed(1) + '%';
const baseline = {lambda:3, mu:2, desks:2, capacity:10, containment:0.55, frequency:8};
const settings = [
  ['lambda','Form submissions / min · λ',0.5,12,0.5],
  ['mu','Reviews / volunteer / min · μ',0.5,6,0.5],
  ['desks','Staffed desks · c',1,5,1],
  ['capacity','Total intake slots · K',1,30,1],
  ['containment','Screening success · q',0,1,0.05],
  ['frequency','Potential incidents / year',0,20,1]
];
const episodes = [
  {title:'Book drive opening',story:'A campaign announcement sends a wave of donation forms to two volunteers. Choose whether to add review capacity or hold more requests in the queue.',base:{lambda:8},choices:[
    ['Open two additional desks',{desks:4}],['Expand intake to 20 slots',{capacity:20}]
  ]},
  {title:'Saturday staff shortage',story:'One volunteer handles inquiries during a busy Saturday. Choose between bringing in another reviewer and simplifying the intake checklist.',base:{lambda:5,desks:1,mu:1.5},choices:[
    ['Call in a second volunteer',{desks:2}],['Use a shorter review checklist',{mu:4}]
  ]},
  {title:'Suspicious submission spike',story:'The desk faces a surge in unwanted submissions. Compare stronger screening, which takes longer per review, with additional staffing at the current screening level.',base:{lambda:7,containment:0.25,frequency:16},choices:[
    ['Introduce stricter screening',{containment:0.8,mu:1.5}],['Staff two more desks',{desks:4}]
  ]}
];

let params = {...baseline};
let desk;
let snapshot;
let distribution;
let risk;
let riskTimer;
let series;
let step = 0;
let paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
let worker;
let requestId = 0;
let episodeIndex = 0;
let choiceIndex = 0;
const inputs = {};
const outputs = {};

function make(tag, text) {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  return element;
}

function updateInputs() {
  inputs.capacity.min = params.desks;
  for (const [key] of settings) {
    inputs[key].value = params[key];
    outputs[key].textContent = key === 'containment' ? percent(params[key]) : params[key];
  }
}

for (const [key, name, min, max, increment] of settings) {
  const label = make('label');
  const line = make('span', name);
  const output = make('output');
  const input = make('input');
  input.type = 'range';
  input.setAttribute('aria-label', name);
  input.min = min;
  input.max = max;
  input.step = increment;
  line.append(output);
  label.append(line, input);
  $('inputs').append(label);
  inputs[key] = input;
  outputs[key] = output;
  input.addEventListener('input', () => {
    params[key] = Math.min(max, Math.max(min, input.valueAsNumber));
    params.capacity = Math.max(params.desks, params.capacity);
    refresh();
  });
}

function graphic(id) {
  const canvas = $(id);
  const {width, height} = canvas.getBoundingClientRect();
  if (!width || !height) return;
  const dpr = window.devicePixelRatio || 1;
  const pixelWidth = Math.round(width * dpr);
  const pixelHeight = Math.round(height * dpr);
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,width,height);
  const css = getComputedStyle(document.documentElement);
  const color = name => css.getPropertyValue('--' + name).trim();
  ctx.font = '12px system-ui';
  ctx.textBaseline = 'top';
  return {ctx,width,height,color};
}

function paintDesk() {
  const g = graphic('desk');
  if (!g || !snapshot) return;
  const {ctx,width,color} = g;
  const waiting = snapshot.count - snapshot.busy;
  ctx.fillStyle = color('muted');
  ctx.fillText('Review desks',0,3);
  ctx.fillText('Waiting slots',0,75);
  const deskWidth = Math.min(90,(width - 8 * (params.desks - 1))/params.desks);
  for (let index = 0; index < params.desks; index++) {
    const x = index * (deskWidth + 8);
    ctx.fillStyle = color(index < snapshot.busy ? 'fill' : 'sheet');
    ctx.fillRect(x,24,deskWidth,34);
    ctx.strokeStyle = color('line');
    ctx.strokeRect(x + .5,24.5,deskWidth - 1,33);
    ctx.fillStyle = color('ink');
    ctx.fillText(String(index + 1),x + 9,32);
  }
  const slots = params.capacity - params.desks;
  const unit = Math.min(24,width / Math.max(slots,1));
  for (let index = 0; index < slots; index++) {
    ctx.fillStyle = color(index < waiting ? 'gold' : 'fill');
    ctx.fillRect(index * unit,98,Math.max(3,unit - 2),22);
  }
  if (!slots) ctx.fillText('No waiting capacity',0,98);
  $('desk-status').textContent = snapshot.time.toFixed(1) + ' simulated min · ' +
    snapshot.busy + ' reviewing · ' + waiting + ' waiting';
}

function paintStates() {
  const g = graphic('states');
  if (!g) return;
  const {ctx,width,color} = g;
  const names = ['New','Review','Missed','Held'];
  ctx.fillStyle = color('muted');
  ctx.fillText('New → Review → Missed or Held',0,10);
  distribution.forEach((value,index) => {
    const y = 38 + index * 25;
    ctx.fillStyle = color('fill');
    ctx.fillRect(64,y,Math.max(0,width - 116),14);
    ctx.fillStyle = color(index === 2 ? 'gold' : 'accent');
    ctx.fillRect(64,y,Math.max(0,width - 116) * value,14);
    ctx.fillStyle = color('ink');
    ctx.fillText(names[index],0,y);
    ctx.fillText(percent(value),width - 49,y);
  });
  $('state-status').textContent = 'Step ' + Math.min(Math.floor(step / 2),12) + ' · ' + percent(distribution[2]) +
    ' missed · ' + percent(distribution[3]) + ' held';
}

function paintRisk() {
  const g = graphic('risk');
  if (!g || !risk) return;
  const {ctx,width,height,color} = g;
  const max = Math.max(...risk.bins);
  const axis = height - 22;
  ctx.fillStyle = color('muted');
  ctx.fillText('Synthetic years per bin',0,5);
  ctx.strokeStyle = color('line');
  ctx.beginPath();
  ctx.moveTo(0,axis);
  ctx.lineTo(width,axis);
  ctx.stroke();
  const bar = width / risk.bins.length;
  risk.bins.forEach((count,index) => {
    const h = (axis - 28) * count / max;
    ctx.fillStyle = color('accent');
    ctx.fillRect(index * bar,axis - h,Math.max(1,bar - 2),h);
  });
  ctx.fillStyle = color('muted');
  ctx.fillText('₱0',0,axis + 3);
  const maxLabel = money.format(risk.size * risk.bins.length);
  ctx.fillText(maxLabel,width - ctx.measureText(maxLabel).width,axis + 3);
}

function showRisk(result) {
  risk = result;
  $('risk-status').textContent = 'Mean ' + money.format(risk.mean) + ' · 95th percentile ' + money.format(risk.p95);
  paintRisk();
}

function requestRisk() {
  clearTimeout(riskTimer);
  const id = ++requestId;
  const {frequency, containment} = params;
  risk = undefined;
  graphic('risk');
  $('risk-status').textContent = 'Calculating 10,000 synthetic years…';
  riskTimer = setTimeout(() => {
    if (worker) worker.postMessage({id,frequency,containment});
    else showRisk(model.annualRisk(frequency,containment,61));
  }, 120);
}

if (location.protocol !== 'file:' && typeof Worker === 'function') {
  try {
    worker = new Worker('src/engines/risk-worker.js');
    worker.onmessage = ({data}) => { if (data.id === requestId) showRisk(data.result); };
    worker.onerror = () => {
      worker.terminate();
      worker = undefined;
      requestRisk();
    };
  } catch {
    worker = undefined;
  }
}

function refresh() {
  updateInputs();
  const q = model.queue(params);
  $('metrics').replaceChildren(...[
    ['Blocked submissions',percent(q.blocked)],
    ['Mean wait',q.delay.toFixed(2) + ' min'],
    ['Admitted / min',q.throughput.toFixed(2)]
  ].map(([label,value]) => {
    const box = make('div');
    box.className = 'metric';
    box.append(make('span',label),make('strong',value));
    return box;
  }));
  desk = model.createDesk(params,2000);
  snapshot = desk.advance(0);
  series = model.chain(params.containment);
  distribution = [1,0,0,0];
  step = 0;
  paintDesk();
  paintStates();
  requestRisk();
}

function paintComparison() {
  const g = graphic('compare-chart');
  if (!g) return;
  const {ctx,width,color} = g;
  const episode = episodes[episodeIndex];
  const before = {...baseline,...episode.base};
  const after = {...before,...episode.choices[choiceIndex][1]};
  [before,after].map(model.queue).forEach((q,index) => {
    const y = 12 + 38 * index;
    const space = Math.max(0,width - 130);
    ctx.fillStyle = color('ink');
    ctx.fillText(index ? 'After' : 'Before',0,y);
    ctx.fillStyle = color('fill');
    ctx.fillRect(58,y,space,16);
    ctx.fillStyle = color(index ? 'accent' : 'gold');
    ctx.fillRect(58,y,space * q.blocked,16);
    ctx.fillStyle = color('ink');
    ctx.fillText(percent(q.blocked) + ' blocked',width - 69,y);
  });
}

function compare() {
  const episode = episodes[episodeIndex];
  const before = {...baseline,...episode.base};
  const after = {...before,...episode.choices[choiceIndex][1]};
  const q0 = model.queue(before);
  const q1 = model.queue(after);
  const fixed = (value,unit) => value.toFixed(2) + unit;
  const mean = range => money.format(range.frequency * (1-range.containment) * 4000 * Math.exp(.6 ** 2 / 2));
  const rows = [
    ['Blocked submissions',percent(q0.blocked),percent(q1.blocked)],
    ['Mean wait',fixed(q0.delay,' min'),fixed(q1.delay,' min')],
    ['Admitted per minute',fixed(q0.throughput,''),fixed(q1.throughput,'')],
    ['Expected annual incident loss',mean(before),mean(after)]
  ];
  $('comparison').replaceChildren(...rows.map(([metric,...values]) => {
    const row = make('tr');
    const label = make('th',metric);
    label.scope = 'row';
    row.append(label,...values.map(value => make('td',value)));
    return row;
  }));
  params = after;
  refresh();
  paintComparison();
}

function loadEpisode(index) {
  episodeIndex = index;
  choiceIndex = 0;
  const episode = episodes[index];
  $('episode-title').textContent = episode.title;
  $('episode-story').textContent = episode.story;
  Array.from($('episode-buttons').children).forEach((button,i) => button.setAttribute('aria-pressed',i === index));
  $('choices').replaceChildren(...episode.choices.map(([text],i) => {
    const label = make('label');
    const radio = make('input');
    radio.type = 'radio';
    radio.name = 'decision';
    radio.checked = !i;
    label.append(radio,' ' + text);
    radio.addEventListener('change', () => {
      choiceIndex = i;
      compare();
    });
    return label;
  }));
  compare();
}

for (const [index,episode] of episodes.entries()) {
  const button = make('button',episode.title);
  button.addEventListener('click',() => loadEpisode(index));
  $('episode-buttons').append(button);
}

let current;
function route() {
  const hash = location.hash.slice(1);
  const destinations = ['lab','scenarios','codex'];
  const destination = destinations.includes(hash) ? hash : 'scenarios';
  for (const name of destinations) $(name).hidden = name !== destination;
  for (const link of document.querySelectorAll('nav a')) {
    if (link.hash === '#' + destination) link.setAttribute('aria-current','page');
    else link.removeAttribute('aria-current');
  }
  if (destination === 'scenarios' && current !== destination) loadEpisode(episodeIndex);
  current = destination;
  repaint();
}

function repaint() {
  if (current === 'lab') {
    paintDesk();
    paintStates();
    paintRisk();
  }
  if (current === 'scenarios') paintComparison();
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  $('theme').textContent = theme === 'dark' ? 'Light mode' : 'Dark mode';
  repaint();
}

try { if (localStorage.getItem('intake-theme') === 'dark') setTheme('dark'); } catch {}
$('theme').addEventListener('click',() => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  setTheme(next);
  try { localStorage.setItem('intake-theme',next); } catch {}
});
$('pause').textContent = paused ? 'Play' : 'Pause';
$('pause').addEventListener('click',() => {
  paused = !paused;
  $('pause').textContent = paused ? 'Play' : 'Pause';
});
$('reset').addEventListener('click',() => {
  params = {...baseline};
  refresh();
});
$('open-lab').addEventListener('click',() => { location.hash = 'lab'; });

function runChecks() {
  $('checks').replaceChildren(...[...model.checks(), ...globalThis.IntakeCoverage.checks()].map(check => {
    const line = make('li');
    const status = make('strong',check.passed ? 'PASS ' : 'FAIL ');
    status.className = check.passed ? 'pass' : 'fail';
    line.append(status,check.name,make('br'),check.error === undefined ? check.standard : check.standard + ' · error ' + check.error.toExponential(2));
    return line;
  }));
}
$('verify').addEventListener('click',() => {
  runChecks();
  $('drawer').showModal();
});
$('close').addEventListener('click',() => $('drawer').close());
$('rerun').addEventListener('click',runChecks);
for (const link of document.querySelectorAll('[data-topic]')) {
  link.addEventListener('click', event => {
    event.preventDefault();
    const details = $(link.dataset.topic);
    details.open = true;
    details.querySelector('summary').focus({preventScroll:true});
    details.scrollIntoView({block:'start'});
  });
}
window.addEventListener('hashchange',route);
window.addEventListener('resize',repaint);
refresh();
route();

setInterval(() => {
  if (paused || current !== 'lab' || document.hidden) return;
  snapshot = desk.advance(.25);
  step++;
  if (step % 2 === 0 && step <= 24) {
    distribution = model.transition(distribution,series);
    paintStates();
    $('state-status').textContent = 'Step ' + step/2 + ' · ' + percent(distribution[2]) +
      ' missed · ' + percent(distribution[3]) + ' held';
  }
  paintDesk();
},400);


