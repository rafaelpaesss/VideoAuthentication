## Description

O projeto **Lambda-Fiap** é uma aplicação desenvolvida na AWS que utiliza funções Lambda para autenticação de usuários através do Amazon Cognito. O sistema permite que usuários se autentiquem utilizando seus CPFs e senhas.

## Estrutura do Projeto
- **index.js**: Código da função Lambda responsável pela autenticação.
- **package.json**: Gerenciador de dependências e scripts do Node.js.
- **deploy_lambda.yml**: Workflow do GitHub Actions para automação de deploy da lambda e do api gateway.
- **deploy_cognito.yml**: Workflow do GitHub Actions para automação de deploy da cognito.
- Demais itens são itens de apoio ao projeto.

## Link Video demonstração

[Link Video demonstração]([https://youtu.be/KC6eZGTnv-U?si=r02tAF8yG3BW1dNF)]

## Arquitetura

![arquitetura](/arquitetura.png)

Nosso serviço OrdemSystem vai estar em EKS dentro da nuvem da AWS, os CRUD's dos endpoints serão feitos em um RDS na nuvem tambem.

Teremos uma conexão com o mercado pago, para a realização do pagamento do pedido, onde no fluxo de inbound é feita a requisição para gerar um QRcode de pagamento, e no fluxo de outbound recebemos a confirmação do pagamento do pedido em nosso webhook.

**Exemplo de curl para chamada da Lambda**

curl --location 'https://d0nqzxi4gd.execute-api.us-east-1.amazonaws.com/dev/users/*?cpf=xxxxxxx&password=xxxxxxx'

## Developers

- Author - [Felipe José do Nascimento Lima](https://www.linkedin.com/in/felipe-lima-00bb62171/)
- Author - [Victor Ivo Gomes Henrique](https://www.linkedin.com/in/victor-ivo-henrique-68557313a/)
- Author - [Rafael Zanatta Paes Landim](https://www.linkedin.com/in/rafael-landim-81b7aa1ab/)
