
// console.log(parseSentence("P /test-number\n112"))
// console.log(parseSentence("P /test- number\n112"))
// console.log(parseSentence("p /test-number\n"))


// function testLocationMatch(ref, tested) {
//   const r = new Location(ref)
//   const t = new Location(tested)
//
//   const { match, params } = r.matches(t)
//
//   console.log('testing:', {ref, tested})
//
//   if(match)
//     console.log('match with params:', params)
//   else
//     console.log('no match')
//
//   console.log()
// }
//
//
//
// testLocationMatch('/', '/')
// testLocationMatch('/core/manifest', '/core/manifest')
// testLocationMatch('/report/:id/temp', '/report/adx/temp')
// testLocationMatch('/report/:id/:stat', '/report/1344/temp')
//
// testLocationMatch('/banana', '/banana/another')
// testLocationMatch('/banana/another', '/banana')
// testLocationMatch('/banana', '/not-banana')
// testLocationMatch('/report/:id/:stat/boink', '/report/1344/temp')