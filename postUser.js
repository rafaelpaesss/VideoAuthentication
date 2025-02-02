const AWS = require('aws-sdk');
const cognito = new AWS.CognitoIdentityServiceProvider();

const CLIENT_ID = "5g89eehhulocgncdveqb120la3";

exports.handler = async (event) => {
    try {
        const body = JSON.parse(event.body);
        const { userName, email, password, cpf, endereco } = body;

        // Verificar se o usuário já existe
        try {
            await cognito.adminGetUser({
                UserPoolId: process.env.USER_POOL_ID,
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
