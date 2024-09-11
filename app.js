const express = require('express');
const app = express();
const port = 3000;

function gerarListaDeShows() {
    return shows = [
        {
            nome: 'Show 1', data: '10/06/2023', hora: '20:00',
            local: 'Teatro Municipal',valor_ingresso: 50.00,
        },{
            nome: 'Show 2', data: '15/06/2023', hora: '19:30',
            local: 'Centro de Convenções', valor_ingresso: 80.00,
        },{
            nome: "Show 3", data: "20/06/2023", hora: "21:00",
            local: "Ginásio Esportivo",valor_ingresso: 35.00
        },{
            nome: "Show 4", data: "25/06/2023", hora: "18:30",
            local: "Praça Central", valor_ingresso: 20.00
        },{ 
            nome: "Show 5", data: "30/06/2023", hora: "20:30",
            local: "Auditório Universitário", valor_ingresso: 45.00
        }
    ];
}

app.get('/', (req, res) => {
    const listaDeShows = gerarListaDeShows();
    res.json(listaDeShows);
});

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});