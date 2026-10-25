'use strict';

const isChinese = document.documentElement.lang.startsWith('zh');
const panelDescriptions = isChinese ? {
  a: 'A：光栅化和反向状态在峰值附近同时驻留。',
  b: 'B：分离光栅化与投影反向，让局部光栅化缓存提前释放。',
  c: 'C：以 384 MiB 局部预算划分 Leaf，逐块计算并归并完整视图的梯度。',
  d: 'D：候选索引投影进一步降低投影状态和阶段交接的开销。',
  e: 'E：紧凑参数梯度减少视图级梯度缓冲，得到主配置 BoundedGS。',
  f: 'F：3 × 3 分组和 128 MiB 局部预算继续压低工作集，同时增加执行开销。'
} : {
  a: 'A: Rasterization and backward state coexist around the peak.',
  b: 'B: Separating rasterization and projection backward lets local rasterization caches leave memory sooner.',
  c: 'C: A 384 MiB local budget guides leaf partitioning; gradients are accumulated across the full view.',
  d: 'D: Candidate-indexed projection further reduces projection state and stage-handoff memory.',
  e: 'E: Compact parameter gradients reduce view-level gradient buffers, giving the main BoundedGS configuration.',
  f: 'F: A 3 × 3 grouping and 128 MiB local budget lower the working set further, with more execution overhead.'
};
const panelSizes = {a: [398, 222], b: [378, 222], c: [375, 222], d: [398, 180], e: [378, 180], f: [375, 180]};
const panelSelector = document.querySelector('#component-panel');
panelSelector.addEventListener('change', () => {
  const option = panelSelector.selectedOptions[0];
  const image = document.querySelector('#component-image');
  image.src = option.dataset.src;
  image.alt = `${isChinese ? '图 ' : 'Figure '}3${option.value.toUpperCase()}: ${option.textContent.slice(4)}`;
  [image.width, image.height] = panelSizes[option.value];
  document.querySelector('#component-caption').textContent = panelDescriptions[option.value];
});

const initialPanel = new URLSearchParams(location.search).get('panel');
if (Object.hasOwn(panelDescriptions, initialPanel)) {
  panelSelector.value = initialPanel;
  panelSelector.dispatchEvent(new Event('change'));
}
document.querySelectorAll('[data-component]').forEach(link => {
  link.addEventListener('click', () => {
    panelSelector.value = link.dataset.component;
    panelSelector.dispatchEvent(new Event('change'));
  });
});

// Static pages also support language switching without JavaScript.
document.querySelector('.language-toggle').addEventListener('click', event => {
  const headerBottom = document.querySelector('.site-header').getBoundingClientRect().bottom;
  const sections = [...document.querySelectorAll('main > section[id], #citation')];
  const anchored = document.getElementById(location.hash.slice(1));
  const rect = anchored?.getBoundingClientRect();
  const current = rect && rect.top < innerHeight && rect.bottom > headerBottom
    ? anchored
    : sections.filter(section => section.getBoundingClientRect().top <= headerBottom + 80).pop();
  const target = new URL(event.currentTarget.href);
  target.hash = current ? current.id : 'overview';
  if (panelSelector.value !== 'a') target.searchParams.set('panel', panelSelector.value);
  else target.searchParams.delete('panel');
  event.currentTarget.href = target.href;
});

document.querySelector('#copy-citation').addEventListener('click', async () => {
  const citation = document.querySelector('#bibtex');
  const status = document.querySelector('#copy-status');
  try {
    await navigator.clipboard.writeText(citation.textContent);
    status.textContent = isChinese ? '已复制引用。' : 'Citation copied.';
  } catch {
    const range = document.createRange();
    range.selectNodeContents(citation);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    status.textContent = isChinese ? '已选中引用，请使用系统复制命令。' : 'Citation selected. Press Ctrl+C or Command+C to copy.';
  }
});
