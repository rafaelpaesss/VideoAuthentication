const AWS = require('aws-sdk');
const { handler } = require('../src/postUser');

// Adicionando o manipulador de rejeições não tratadas
process.on('unhandledRejection', (reason, promise) => {
  console.error('Rejeição não tratada:', reason);
  // Você pode adicionar um comportamento customizado aqui, como enviar para logs, etc.
});

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
    jest.clearAllMocks();
  });

  it('should return 400 if user already exists', async () => {
    try {
      const event = {
        body: JSON.stringify({
          userName: 'testUser',
          email: 'testuser@example.com',
          password: 'password123',
          cpf: '12345678901',
          endereco: 'Rua Exemplo, 123',
        }),
      };

      cognito.adminGetUser.mockResolvedValueOnce({});
      
      const response = await handler(event);
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).error).toBe('Usuário já existe.');
    } catch (error) {
      console.error('Erro:', error);
    }
  });

  it('should return 500 if there is an error creating the user in Cognito', async () => {
    try {
      const event = {
        body: JSON.stringify({
          userName: 'testUser',
          email: 'testuser@example.com',
          password: 'password123',
          cpf: '12345678901',
          endereco: 'Rua Exemplo, 123',
        }),
      };

      cognito.adminGetUser.mockRejectedValueOnce({ code: 'UserNotFoundException' });
      cognito.signUp.mockRejectedValueOnce(new Error('Erro ao criar usuário'));

      const response = await handler(event);
      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body).error).toBe('Erro ao criar usuário');
    } catch (error) {
      console.error('Erro:', error);
    }
  });

  it('should return 201 and create a user successfully', async () => {
    try {
      const event = {
        body: JSON.stringify({
          userName: 'testUser',
          email: 'testuser@example.com',
          password: 'password123',
          cpf: '12345678901',
          endereco: 'Rua Exemplo, 123',
        }),
      };

      cognito.adminGetUser.mockRejectedValueOnce({ code: 'UserNotFoundException' });
      cognito.signUp.mockResolvedValueOnce({});
      sns.publish.mockResolvedValueOnce({});
      sns.subscribe.mockResolvedValueOnce({});

      const response = await handler(event);
      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.body).message).toBe(
        'Usuário cadastrado com sucesso, notificado no SNS e assinatura criada!'
      );
    } catch (error) {
      console.error('Erro:', error);
    }
  });

  it('should return 500 if SNS publishing fails', async () => {
    try {
      const event = {
        body: JSON.stringify({
          userName: 'testUser',
          email: 'testuser@example.com',
          password: 'password123',
          cpf: '12345678901',
          endereco: 'Rua Exemplo, 123',
        }),
      };

      cognito.adminGetUser.mockRejectedValueOnce({ code: 'UserNotFoundException' });
      cognito.signUp.mockResolvedValueOnce({});
      sns.publish.mockRejectedValueOnce(new Error('Erro ao publicar no SNS'));

      const response = await handler(event);
      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body).error).toBe('Erro ao publicar no SNS');
    } catch (error) {
      console.error('Erro:', error);
    }
  });

  it('should return 500 if SNS subscription fails', async () => {
    try {
      const event = {
        body: JSON.stringify({
          userName: 'testUser',
          email: 'testuser@example.com',
          password: 'password123',
          cpf: '12345678901',
          endereco: 'Rua Exemplo, 123',
        }),
      };

      cognito.adminGetUser.mockRejectedValueOnce({ code: 'UserNotFoundException' });
      cognito.signUp.mockResolvedValueOnce({});
      sns.publish.mockResolvedValueOnce({});
      sns.subscribe.mockRejectedValueOnce(new Error('Erro ao criar a assinatura no SNS'));

      const response = await handler(event);
      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body).error).toBe('Erro ao criar a assinatura no SNS');
    } catch (error) {
      console.error('Erro:', error);
    }
  });
});
