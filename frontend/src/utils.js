export function possibleTours(n) {
  if (n<3) return 1
  let result=1n
  for (let i=2n;i<=BigInt(n-1);i++) result *= i
  return result/2n
}
export function formatBigNumber(bn) {
  return bn.toLocaleString()
}