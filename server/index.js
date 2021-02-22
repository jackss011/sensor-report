const App = require('./Server').App

const PORT = 3000;


const app = new App()

app.route('P', '/test-number', req => {
  console.log('test-number', req.json())
})

app.route('P', '/report/:id', req => {
  console.log('report content for', req.params.id, ':', req.json()['temp'])
})

app.listen(PORT, () => console.log('listening...'))
