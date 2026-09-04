import assert from 'node:assert/strict';

const FULL_NAMES={
  moerstedt:'Max Moerstedt',maluze:'Jeremiaha Maluze','ter horst':'Jano ter Horst',
  nakuzola:'Rael Nakuzola',nicolas:'Moritz Nicolas',itakura:'Ko Itakura',
  saibari:'Ismael Saibari',reis:'Ludovit Reis',raab:'Matheo Raab',tietz:'Phillip Tietz',
  'castro montes':'Alessio Castro-Montes',fernandez:'Ignacio Fernández',garcia:'Aleix García',
  anton:'Waldemar Anton',olise:'Michael Olise'
};
const norm=v=>String(v||'').toLocaleLowerCase('de-DE').normalize('NFD')
  .replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const surname=v=>norm(v).split(' ').filter(Boolean).at(-1)||'';
const canonicalName=name=>FULL_NAMES[norm(name)]||FULL_NAMES[surname(name)]||String(name||'').trim();
const posLabel=value=>{
  const p=norm(value);
  if(/^(tor|tw|goalkeeper|keeper|goal)/.test(p))return'Tor';
  if(/^(abwehr|abw|defence|defense|defender|def)/.test(p))return'Abwehr';
  if(/^(mittelfeld|mf|midfield|mid)/.test(p))return'Mittelfeld';
  if(/^(sturm|ang|offence|offense|attack|attacker|forward)/.test(p))return'Sturm';
  return String(value||'');
};
function samePlayer(a,b){return canonicalName(a)===canonicalName(b)}
function buy(state,input){
  const name=canonicalName(input.name);
  const duplicate=state.players.find(p=>!p.soldDate&&samePlayer(p.name,name));
  assert.equal(duplicate,undefined,`Aktiver Spieler darf nicht doppelt gekauft werden: ${name}`);
  const row={
    id:`test-${state.seq++}`,name,team:input.team,position:posLabel(input.position),
    buyDate:input.date,buyPrice:Number(input.price),buyCounterparty:input.counterparty||'Kickbase',
    soldDate:'',salePrice:0,saleCounterparty:''
  };
  state.players.push(row);
  return row;
}
function sell(state,input){
  const name=canonicalName(input.name);
  const matches=state.players.filter(p=>!p.soldDate&&samePlayer(p.name,name));
  assert.equal(matches.length,1,`Verkauf muss genau einen aktiven Lebenszyklus finden: ${name}`);
  const row=matches[0];
  row.soldDate=input.date;row.salePrice=Number(input.price);row.saleCounterparty=input.counterparty||'Kickbase';
  return row;
}
function active(state){return state.players.filter(p=>!p.soldDate)}
function lineupCandidates(state){return active(state).map(p=>p.id)}

const state={players:[],seq:1};
const bought=buy(state,{
  name:'Anton',team:'Borussia Dortmund',position:'Defence',date:'2026-09-05',price:12_345_678,counterparty:'Kickbase'
});
assert.equal(bought.name,'Waldemar Anton');
assert.equal(bought.position,'Abwehr');
assert.equal(state.players.length,1,'Kauf erzeugt genau einen Lebenszyklus');
assert.equal(active(state).length,1,'Kauf macht Spieler aktiv');
assert.deepEqual(lineupCandidates(state),[bought.id],'Kauf macht Spieler für Aufstellung verfügbar');

const sold=sell(state,{
  name:'Waldemar Anton',date:'2026-09-06',price:13_000_000,counterparty:'Kickbase'
});
assert.equal(sold.id,bought.id,'Verkauf ergänzt denselben Lebenszyklus');
assert.equal(state.players.length,1,'Verkauf erzeugt keine zweite Tabellenzeile');
assert.equal(active(state).length,0,'Verkauf entfernt Spieler aus aktivem Kader');
assert.deepEqual(lineupCandidates(state),[],'Verkauf entfernt Spieler aus Aufstellungs-Kandidaten');
assert.equal(sold.salePrice,13_000_000);

console.log('Transfer pipeline OK: 1 Kauf -> 1 Lebenszyklus -> 1 Verkauf, keine Dublette, deutsche Position, Kader/Aufstellung synchron.');
