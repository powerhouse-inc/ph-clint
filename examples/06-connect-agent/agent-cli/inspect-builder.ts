import { ReactorClientBuilder } from '@powerhousedao/reactor';

const b = new ReactorClientBuilder();
let obj: any = b;
const methods = new Set<string>();
while (obj && obj !== Object.prototype) {
  for (const key of Object.getOwnPropertyNames(obj)) {
    if (key !== 'constructor' && typeof obj[key] === 'function') {
      methods.add(key);
    }
  }
  obj = Object.getPrototypeOf(obj);
}
console.log('ReactorClientBuilder methods:');
for (const m of [...methods].sort()) console.log(`  ${m}`);
