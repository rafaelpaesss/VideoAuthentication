const AWS = require('aws-sdk');

// Definindo a região onde está o Cognito
const cognito = new AWS.CognitoIdentityServiceProvider({ region: 'us-east-1' });

// Configuração do Client ID 
const clientId = '2mhr5l3ba98rl137k28hb088g6'; 

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
            AuthFlow: 'USER_PASSWORD_AUTH', // Verifique se este fluxo está habilitado
            ClientId: clientId, // Remova o UserPoolId
            AuthParameters: {
                USERNAME: cpf,  // Utilizando o CPF como nome de usuário
                PASSWORD: password // Validando a senha fornecida
            }
        };

        // Autenticar o usuário no Cognito
        const authResponse = await cognito.initiateAuth(authParams).promise();

        // Se a autenticação for bem-sucedida, retorna o token
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Autenticação bem-sucedida",
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
