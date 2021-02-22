const { App } = require('./Server')

const PORT = 3000;


const app = new App()

app.route('P', '/test-number', req => {
  console.log('test-number', req.json())
})

let num = 0;

app.route('P', '/report/:id', (req, res) => {
  console.log('report content for', req.params.id, ':', req.json()['temp'])
  res.send('P', `nope/${num++}`, '')
})

app.listen(PORT, () => console.log('listening...'))
