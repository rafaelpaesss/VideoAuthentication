const AWS = require('aws-sdk');
const { handler } = require('../src/postUser'); // Ajuste o caminho conforme a localização do seu arquivo

// Mocking AWS SDK services
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

        cognito.adminGetUser.mockRejectedValueOnce({ code: 'UserNotFoundException' }); // Usuário não encontrado
        cognito.signUp.mockResolvedValueOnce({});
        sns.publish.mockResolvedValueOnce({});
        sns.subscribe.mockResolvedValueOnce({});

        try {
            const response = await handler(event); // Aguarde a execução
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

            expect(response.statusCode).toBe(201);
            expect(JSON.parse(response.body).message).toBe(
                'Usuário cadastrado com sucesso, notificado no SNS e assinatura criada!'
            );
        } catch (err) {
            console.error('Erro inesperado:', err); // Log do erro
            throw err; // Re-throw the error to indicate failure
        }
    });

    it('should return an error if the user already exists', async () => {
        const event = {
            body: JSON.stringify({
                userName: 'testuser',
                email: 'testuser@example.com',
                password: 'password123',
                cpf: '12345678901',
                endereco: 'Rua Exemplo, 123',
            }),
        };

        cognito.adminGetUser.mockResolvedValueOnce({}); // Usuário já existe

        try {
            const response = await handler(event); // Aguarde a execução
            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.body).error).toBe('Usuário já existe.');
        } catch (err) {
            console.error('Erro inesperado:', err);
            throw err;
        }
    });

    it('should return an internal server error if any other error occurs', async () => {
        const event = {
            body: JSON.stringify({
                userName: 'testuser',
                email: 'testuser@example.com',
                password: 'password123',
                cpf: '12345678901',
                endereco: 'Rua Exemplo, 123',
            }),
        };

        cognito.adminGetUser.mockRejectedValueOnce(new Error('Erro inesperado'));

        try {
            const response = await handler(event);
            expect(response.statusCode).toBe(500);
            expect(JSON.parse(response.body).error).toBe('Erro inesperado');
        } catch (err) {
            console.error('Erro inesperado:', err);
            throw err;
        }
    });
});
