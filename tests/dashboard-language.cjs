const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = (path) => fs.readFileSync(path, 'utf8');

test('dashboard navigation uses the requested language consistently', () => {
  const app = read('src/components/core/SahApp.tsx');
  const command = read('src/components/core/CommandPalette.tsx');
  const reports = read('src/components/core/ReportsView.tsx');

  for (const phrase of [
    'Âlem',
    'Attention Is All You Need',
    'Allah’a en sevimli olan mekânlar',
    'Gelişim Raporlarım',
  ]) {
    assert.match(app, new RegExp(phrase));
    assert.match(command, new RegExp(phrase));
  }
  assert.match(reports, /<h1>Gelişim Raporlarım<\/h1>/);
  assert.doesNotMatch(app, /Tefekkür Vahası/);
  assert.doesNotMatch(app, /className="header-feedback"/);
  assert.doesNotMatch(app, /> Gelişim raporlarım\s*</);
  assert.doesNotMatch(app, /> Görüş ve öneri\s*</);
});

test('dashboard copy and spiritual development stages are coherent', () => {
  const dashboard = read('src/components/core/DashboardView.tsx');
  const scene = read('src/components/core/GrowthScene.tsx');
  const constants = read('src/lib/constants.ts');

  assert.match(dashboard, /Ameller ancak niyetlere göredir/);
  assert.match(dashboard, /Manevi Gelişim Sahnesi/);
  assert.match(appCopy(), /Gününü Gün Etmek İçin Yaz/);
  assert.match(scene, /Sıradaki manevi gelişim sahnesi/);
  assert.match(scene, /10 AŞAMALI MANEVİ GELİŞİM/);
  for (const stage of ['Niyet', 'Gayret', 'Sebat', 'İstikamet', 'Muhasebe', 'Tefekkür', 'Hikmet', 'Basiret', 'Marifet', 'Âlem']) {
    assert.match(constants, new RegExp(`name: '${stage}'`));
  }
  for (const oldStage of ['Dağ', 'Yıldız', 'Güneş', 'Galaksi', 'Evren']) {
    assert.doesNotMatch(constants, new RegExp(`name: '${oldStage}'`));
  }
});

function appCopy() {
  return read('src/components/core/SahApp.tsx');
}
