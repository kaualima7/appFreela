import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const exported = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/types/payment.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, { exports: exported });
const { paymentTotals, formatCents } = exported;
const totals = paymentTotals([
  { amount: '0.10', status: 'PAID' },
  { amount: '0.20', status: 'PAID' },
  { amount: '1500.50', status: 'PENDING' },
  { amount: '999.99', status: 'CANCELLED' },
]);
assert.equal(totals.received, 30n);
assert.equal(totals.pending, 150050n);
assert.equal(totals.registered, 150080n);
assert.equal(formatCents(totals.registered), 'R$ 1.500,80');
assert.equal(paymentTotals([]).registered, 0n);
assert.equal(paymentTotals([{ amount: '10.1', status: 'PENDING' }]).pending, 1010n);
const large = paymentTotals(Array.from({ length: 100000 }, () => ({ amount: '999999999.99', status: 'PAID' })));
assert.equal(large.received, 9999999999900000n);
console.log('OK: centavos exatos, estados, cancelados excluídos, lista vazia e soma acima do limite seguro de Number.');
