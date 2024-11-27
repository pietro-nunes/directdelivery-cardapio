const express = require('express');
const path = require('path');

const app = express();

// Servir os arquivos estáticos do diretório build
app.use(express.static(path.join(__dirname, 'build')));

// Rota para redirecionar todas as requisições para o index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});