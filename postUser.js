const AWS = require('aws-sdk');
const cognito = new AWS.CognitoIdentityServiceProvider();

const CLIENT_ID = "2kq38icmnl2o8tnp849f04tq57";
const userPoolId = process.env.USER_POOL_ID || "us-east-1_n8dcY8my5"; // ou o ID correto
console.log("USER_POOL_ID configurado:", process.env.USER_POOL_ID);

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

        const params = {
            ClientId: CLIENT_ID,
            Username: email,
            Password: password,
            UserAttributes: [
                { Name: "email", Value: email },
                { Name: "custom:cpf", Value: cpf },
                { Name: "custom:endereco", Value: endereco }
            ]
        };

        await cognito.signUp(params).promise();

        return {
            statusCode: 201,
            body: JSON.stringify({ message: "Usuário cadastrado com sucesso!" })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
