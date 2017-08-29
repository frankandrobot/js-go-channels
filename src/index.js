import "babel-polyfill"

function *foo() {
  yield 1;
  yield 2;
}

const gen = foo();

console.log(gen.next().value)
console.log(gen.next().value)

const iterable = {
  [Symbol.iterator]: foo,
}

for(let i of iterable) {
  console.log(i)
}
