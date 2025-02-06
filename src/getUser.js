const AWS = require('aws-sdk');

const cognito = new AWS.CognitoIdentityServiceProvider({ region: 'us-east-1' });
const clientId = '2kq38icmnl2o8tnp849f04tq57'; // Client ID do Cognito

exports.handler = async (event) => {
    console.log("Evento recebido:", JSON.stringify(event));

    const userName = event.queryStringParameters?.userName;
    const password = event.queryStringParameters?.password;

    if (!userName) {
        console.error("Erro: Nome de usuário não fornecido");
        return { statusCode: 400, body: JSON.stringify({ error: "Nome de usuário não fornecido" }) };
    }

    if (!password) {
        console.error("Erro: Senha não fornecida");
        return { statusCode: 400, body: JSON.stringify({ error: "Senha não fornecida" }) };
    }

    try {
        const authParams = {
            AuthFlow: 'USER_PASSWORD_AUTH',
            ClientId: clientId,
            AuthParameters: { USERNAME: userName, PASSWORD: password }
        };

        console.log("Iniciando autenticação...");
        const authResponse = await cognito.initiateAuth(authParams).promise();

        console.log("Resposta de autenticação:", JSON.stringify(authResponse));

        // Caso o usuário precise alterar a senha (quando não confirmada no Cognito)
        if (authResponse.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
            const newPassword = password;

            const challengeParams = {
                ChallengeName: 'NEW_PASSWORD_REQUIRED',
                ClientId: clientId,
                Session: authResponse.Session,
                ChallengeResponses: {
                    USERNAME: userName,
                    NEW_PASSWORD: newPassword
                }
            };

            console.log("Respondendo ao desafio de nova senha...");
            const finalAuthResponse = await cognito.respondToAuthChallenge(challengeParams).promise();

            console.log("Autenticação concluída com sucesso:", JSON.stringify(finalAuthResponse));

            const accessToken = finalAuthResponse.AuthenticationResult.AccessToken;

            // Buscar dados do usuário no Cognito
            const userData = await cognito.getUser({ AccessToken: accessToken }).promise();
            console.log("Dados do usuário:", JSON.stringify(userData));

            const email = userData.UserAttributes.find(attr => attr.Name === 'email')?.Value || null;
            const endereco = userData.UserAttributes.find(attr => attr.Name === 'custom:endereco')?.Value || null;
            const cpf = userData.UserAttributes.find(attr => attr.Name === 'custom:cpf')?.Value || null;

            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: "Autenticação bem-sucedida",
                    email,
                    endereco,
                    cpf
                })
            };
        }

        // Se a autenticação for bem-sucedida e não houver desafio
        if (authResponse.AuthenticationResult) {
            const accessToken = authResponse.AuthenticationResult.AccessToken;

            const userData = await cognito.getUser({ AccessToken: accessToken }).promise();
            console.log("Dados do usuário:", JSON.stringify(userData));

            const email = userData.UserAttributes.find(attr => attr.Name === 'email')?.Value || null;
            const endereco = userData.UserAttributes.find(attr => attr.Name === 'custom:endereco')?.Value || null;
            const cpf = userData.UserAttributes.find(attr => attr.Name === 'custom:cpf')?.Value || null;

            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: "Autenticação bem-sucedida",
                    email,
                    endereco,
                    cpf
                })
            };
        }

        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Falha na autenticação" })
        };

    } catch (error) {
        console.error("Erro ao autenticar usuário:", error);

        if (error.code === 'NotAuthorizedException') {
            return { statusCode: 401, body: JSON.stringify({ error: "Senha incorreta ou usuário não autorizado" }) };
        }
        if (error.code === 'UserNotFoundException') {
            return { statusCode: 404, body: JSON.stringify({ error: "Usuário não encontrado" }) };
        }
        if (error.code === 'AccessDeniedException') {
            return { statusCode: 403, body: JSON.stringify({ error: "Acesso negado ao Cognito" }) };
        }

        return { statusCode: 500, body: JSON.stringify({ error: "Erro interno do servidor", details: error.message }) };
    }
};
