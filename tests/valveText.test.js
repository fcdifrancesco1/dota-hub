import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fillValues, itemBonuses, itemDescriptionBlocks } from '../src/utils/valveText.js';

// Trechos reais do feed itemdata da Valve (Adaga de Translocação e Coração de Tarrasque)
const blink = {
  desc_loc: "<h1>Ativa: Translocar</h1> Teletransporte-se a um ponto alvo que está a até %blink_range% unidades de distância. <br><br>A Adaga de Translocação não poderá ser usada por %blink_damage_cooldown% segundos após sofrer dano de um herói inimigo ou Roshan.\nEm inglês: <b><font color='#F2A93E'>Blink Dagger</font></b>",
  special_values: [
    { name: 'blink_range', values_float: [1200], is_percentage: false, heading_loc: '' },
    { name: 'blink_damage_cooldown', values_float: [3], is_percentage: false, heading_loc: '' }
  ]
};
const heart = {
  desc_loc: '<h1>Passiva: Sangue de Beemote</h1>Aumenta a sua regeneração de vida em %missing_health_regen%%% da sua vida perdida.\nEm inglês: <b>Heart of Tarrasque</b>',
  special_values: [
    { name: 'bonus_strength', values_float: [40], is_percentage: false, heading_loc: '+$str' },
    { name: 'hp_regen', values_float: [1], is_percentage: true, heading_loc: '+de regeneração de vida máxima' },
    { name: 'missing_health_regen', values_float: [1.5], is_percentage: true, heading_loc: '' }
  ]
};

test('descrição em blocos, com os valores preenchidos e sem a linha em inglês', () => {
  const [block] = itemDescriptionBlocks(blink);
  assert.equal(block.title, 'Ativa: Translocar');
  assert.match(block.text, /até 1200 unidades/);
  assert.match(block.text, /por 3 segundos/);
  assert.doesNotMatch(block.text, /Em inglês|Blink Dagger/);
});

test('%% vira % depois do valor', () => {
  assert.equal(itemDescriptionBlocks(heart)[0].text, 'Aumenta a sua regeneração de vida em 1.5% da sua vida perdida.');
});

test('bônus: marcador da Valve vira o atributo, texto livre fica como veio', () => {
  assert.deepEqual(itemBonuses(heart), ['+40 Força', '+1% de regeneração de vida máxima']);
  assert.deepEqual(itemBonuses({ special_values: [
    { name: 'cast_range_bonus', values_float: [60, 90, 120], heading_loc: '+$cast_range' },
    { name: 'cooldown_duration', values_float: [105], heading_loc: 'INTERVALO ENTRE USOS:' }
  ] }), ['+60 / 90 / 120 de alcance de lançamento', 'Intervalo entre usos: 105']);
});

test('fillValues ignora marcadores que não existem', () => {
  assert.equal(fillValues('%x% e %y%', [{ name: 'x', values_float: [2] }]), '2 e %y%');
});
