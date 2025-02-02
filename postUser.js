const AWS = require('aws-sdk');
const cognito = new AWS.CognitoIdentityServiceProvider();
const sns = new AWS.SNS(); // Adicionando a inicialização do SNS

const CLIENT_ID = "2kq38icmnl2o8tnp849f04tq57";
const userPoolId = process.env.USER_POOL_ID || "us-east-1_n8dcY8my5";
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN || "arn:aws:sns:us-east-1:300254322294:RedshiftSNS"; // Substitua pelo ARN correto

exports.handler = async (event) => {
    try {
        const body = JSON.parse(event.body);
        const { userName, email, password, cpf, endereco } = body;

        // Verificar se o usuário já existe
        try {
            await cognito.adminGetUser({
                UserPoolId: userPoolId,
                Username: email
            }).promise();
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Usuário já existe." })
            };
        } catch (error) {
            if (error.code !== 'UserNotFoundException') {
                throw error;
            }
        }

        // Criar usuário no Cognito
        const params = {
            ClientId: CLIENT_ID,
            Username: email,
            Password: password,
            UserAttributes: [
                { Name: "email", Value: email },
                { Name: "custom:cpf", Value: cpf },
                { Name: "custom:endereco", Value: String(endereco) }
            ]
        };

        await cognito.signUp(params).promise();

        // Publicar no SNS
        await sns.publish({
            TopicArn: SNS_TOPIC_ARN,
            Message: JSON.stringify({ email, cpf, endereco }),
            Subject: "Novo Cadastro de Usuário"
        }).promise();

        return {
            statusCode: 201,
            body: JSON.stringify({ message: "Usuário cadastrado com sucesso e notificado no SNS!" })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
