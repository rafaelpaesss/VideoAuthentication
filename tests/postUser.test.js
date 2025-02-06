const AWS = require('aws-sdk');

// Mocks das dependências
jest.mock('aws-sdk', () => {
    const mockCognito = {
        adminGetUser: jest.fn(),
        signUp: jest.fn(),
    };

    const mockSNS = {
        publish: jest.fn(),
        subscribe: jest.fn(),
    };

    return {
        CognitoIdentityServiceProvider: jest.fn(() => mockCognito),
        SNS: jest.fn(() => mockSNS),
    };
});

// Handler do postUser
const handler = async (event) => {
    const { userName, email, password, cpf, endereco } = JSON.parse(event.body);
    const cognito = new AWS.CognitoIdentityServiceProvider();
    const sns = new AWS.SNS();

    try {
        // Verifica se o usuário já existe no Cognito
        try {
            await cognito.adminGetUser({
                UserPoolId: 'us-east-1_n8dcY8my5',
                Username: userName,
            }).promise();
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Usuário já existe!' }),
            };
        } catch (error) {
            if (error.code !== 'UserNotFoundException') {
                throw error;
            }
        }

        // Cria o novo usuário no Cognito
        await cognito.signUp({
            ClientId: '2kq38icmnl2o8tnp849f04tq57',
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
            TopicArn: 'arn:aws:sns:us-east-1:300254322294:Teste',
            Message: JSON.stringify({ userName, email, cpf, endereco }),
            Subject: 'Novo Cadastro de Usuário',
        }).promise();

        // Cria uma assinatura no SNS
        await sns.subscribe({
            TopicArn: 'arn:aws:sns:us-east-1:300254322294:Teste',
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
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Erro ao processar a solicitação.' }),
        };
    }
};

// Teste unitário do handler
describe('postUser handler', () => {
    let cognito;
    let sns;

    beforeEach(() => {
        cognito = new AWS.CognitoIdentityServiceProvider();
        sns = new AWS.SNS();
    });

    afterEach(() => {
        jest.clearAllMocks(); // Limpa todos os mocks após cada teste
    });

    it('should successfully register a user, send a notification, and create an SNS subscription', async () => {
        const event = {
            body: JSON.stringify({
                userName: 'testuser',
                email: 'testuser@example.com',
                password: 'password123',
                cpf: '12345678901',
                endereco: 'Rua Exemplo, 123',
            }),
        };

        // Mock de respostas das funções
        cognito.adminGetUser.mockRejectedValueOnce({ code: 'UserNotFoundException' });
        cognito.signUp.mockResolvedValueOnce({});
        sns.publish.mockResolvedValueOnce({});
        sns.subscribe.mockResolvedValueOnce({});

        // Chama o handler com o evento simulado
        const response = await handler(event);

        // Verificações das chamadas das funções mockadas
        expect(cognito.adminGetUser).toHaveBeenCalledWith({
            UserPoolId: 'us-east-1_n8dcY8my5',
            Username: 'testuser',
        });
        expect(cognito.signUp).toHaveBeenCalledWith({
            ClientId: '2kq38icmnl2o8tnp849f04tq57',
            Username: 'testuser',
            Password: 'password123',
            UserAttributes: [
                { Name: 'email', Value: 'testuser@example.com' },
                { Name: 'custom:cpf', Value: '12345678901' },
                { Name: 'custom:endereco', Value: 'Rua Exemplo, 123' },
            ],
        });
        expect(sns.publish).toHaveBeenCalledWith({
            TopicArn: 'arn:aws:sns:us-east-1:300254322294:Teste',
            Message: JSON.stringify({
                userName: 'testuser',
                email: 'testuser@example.com',
                cpf: '12345678901',
                endereco: 'Rua Exemplo, 123',
            }),
            Subject: 'Novo Cadastro de Usuário',
        });
        expect(sns.subscribe).toHaveBeenCalledWith({
            TopicArn: 'arn:aws:sns:us-east-1:300254322294:Teste',
            Protocol: 'email',
            Endpoint: 'testuser@example.com',
        });

        // Verifica a resposta do handler
        expect(response.statusCode).toBe(201);
        expect(JSON.parse(response.body).message).toBe(
            'Usuário cadastrado com sucesso, notificado no SNS e assinatura criada!'
        );
    });
});
