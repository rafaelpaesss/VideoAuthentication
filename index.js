const AWS = require('aws-sdk');

// Definindo a região onde está o Cognito e configurando o User Pool
const cognito = new AWS.CognitoIdentityServiceProvider({ region: 'us-east-1' });

// Configuração do User Pool ID e Client ID 
const userPoolId = 'us-east-1_9sxYnOzXp'; 
const clientId = '5s4e0chc0ses3nr9i5196604ub'; 

exports.handler = async (event) => {
    // Extrair os parâmetros da chamada da API
    const cpf = event.queryStringParameters?.cpf;
    const password = event.queryStringParameters?.password;

    // Validação básica do CPF e da senha
    if (!cpf || cpf.length !== 11) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "CPF inválido" })
        };
    }

    if (!password) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Senha não fornecida" })
        };
    }

    try {
        // Definir os parâmetros para autenticar o usuário
        const authParams = {
            AuthFlow: 'USER_PASSWORD_AUTH',
            UserPoolId: userPoolId,
            ClientId: clientId,
            AuthParameters: {
                USERNAME: cpf,  // Utilizando o CPF como nome de usuário
                PASSWORD: password // Validando a senha fornecida
            }
        };

        // Autenticar o usuário no Cognito
        const authResponse = await cognito.adminInitiateAuth(authParams).promise();

        // Se a autenticação for bem-sucedida, retorna o token
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Autenticação bem-sucedida",
                accessToken: authResponse.AuthenticationResult.AccessToken
            })
        };

    } catch (error) {
        console.error('Erro ao autenticar o usuário no Cognito:', error);

        // Retornando erro de autenticação
        if (error.code === 'NotAuthorizedException') {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: "Senha incorreta ou usuário não autorizado" })
            };
        }

        // Outros erros
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Erro interno do servidor" })
        };
    }
};
