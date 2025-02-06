const AWS = require('aws-sdk');
const cognito = new AWS.CognitoIdentityServiceProvider();
const sns = new AWS.SNS();

exports.handler = async (event) => {
    const { userName, email, password, cpf, endereco } = JSON.parse(event.body);

    try {
        // Verifica se o usuário já existe no Cognito
        try {
            await cognito.adminGetUser({
                UserPoolId: 'us-east-1_n8dcY8my5', // Substitua pelo seu User Pool ID
                Username: userName,
            }).promise();
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Usuário já existe.' }),
            };
        } catch (error) {
            if (error.code !== 'UserNotFoundException') {
                // Se o erro não for de usuário não encontrado, retornamos um erro interno
                return {
                    statusCode: 500,
                    body: JSON.stringify({ error: 'Erro inesperado' }),
                };
            }
        }

        // Cria o usuário no Cognito
        await cognito.signUp({
            ClientId: '2kq38icmnl2o8tnp849f04tq57', // Substitua pelo seu ClientId
            Username: userName,
            Password: password,
            UserAttributes: [
                { Name: 'email', Value: email },
                { Name: 'custom:cpf', Value: cpf },
                { Name: 'custom:endereco', Value: endereco },
            ],
        }).promise();

        // Envia uma notificação via SNS
        await sns.publish({
            TopicArn: 'arn:aws:sns:us-east-1:300254322294:Teste', // Substitua pelo seu ARN do SNS
            Message: JSON.stringify({ userName, email, cpf, endereco }),
            Subject: 'Novo Cadastro de Usuário',
        }).promise();

        // Cria a assinatura do SNS
        await sns.subscribe({
            TopicArn: 'arn:aws:sns:us-east-1:300254322294:Teste', // Substitua pelo seu ARN do SNS
            Protocol: 'email',
            Endpoint: email,
        }).promise();

        return {
            statusCode: 201,
            body: JSON.stringify({
                message: 'Usuário cadastrado com sucesso, notificado no SNS e assinatura criada!',
            }),
        };
    } catch (error) {
        // Caso algum outro erro inesperado ocorra
        console.error('Erro ao processar a requisição:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Erro inesperado' }),
        };
    }
};
