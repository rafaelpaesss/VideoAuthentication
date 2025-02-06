const AWS = require('aws-sdk');
const cognito = new AWS.CognitoIdentityServiceProvider();
const sns = new AWS.SNS();

const USER_POOL_ID = process.env.USER_POOL_ID || 'us-east-1_n8dcY8my5'; // ID do User Pool do Cognito
const CLIENT_ID = process.env.CLIENT_ID || '2kq38icmnl2o8tnp849f04tq57'; // Client ID do Cognito
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN || 'arn:aws:sns:us-east-1:300254322294:Teste'; // ARN do SNS

// Função de handler para o POST de usuário
const handler = async (event) => {
    try {
        const { userName, email, password, cpf, endereco } = JSON.parse(event.body);

        // Verificar se o usuário já existe no Cognito
        try {
            const user = await cognito.adminGetUser({
                UserPoolId: USER_POOL_ID,
                Username: userName,
            }).promise();

            if (user) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ message: 'Usuário já existe' }),
                };
            }
        } catch (err) {
            if (err.code !== 'UserNotFoundException') {
                throw err; // Se for outro erro, lançamos a exceção
            }
        }

        // Registrar novo usuário no Cognito
        const signUpResponse = await cognito.signUp({
            ClientId: CLIENT_ID,
            Username: userName,
            Password: password,
            UserAttributes: [
                { Name: 'email', Value: email },
                { Name: 'custom:cpf', Value: cpf },
                { Name: 'custom:endereco', Value: endereco },
            ],
        }).promise();

        // Publicar uma mensagem no SNS
        const snsPublishResponse = await sns.publish({
            TopicArn: SNS_TOPIC_ARN,
            Message: JSON.stringify({
                userName,
                email,
                cpf,
                endereco,
            }),
            Subject: 'Novo Cadastro de Usuário',
        }).promise();

        // Inscrever o email no SNS
        const snsSubscribeResponse = await sns.subscribe({
            TopicArn: SNS_TOPIC_ARN,
            Protocol: 'email',
            Endpoint: email,
        }).promise();

        // Retornar sucesso
        return {
            statusCode: 201,
            body: JSON.stringify({
                message: 'Usuário cadastrado com sucesso, notificado no SNS e assinatura criada!',
            }),
        };
    } catch (err) {
        console.error('Erro ao cadastrar usuário:', err);

        // Erro geral
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Erro ao cadastrar o usuário', error: err.message }),
        };
    }
};

module.exports = { handler };
