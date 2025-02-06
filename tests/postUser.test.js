const AWS = require('aws-sdk');
const { handler } = require('../src/postUser'); // Importando o handler original

// Mockando as dependências do AWS SDK
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

  it('should return 400 if user already exists', () => {
    const event = {
      body: JSON.stringify({
        userName: 'testUser',
        email: 'testuser@example.com',
        password: 'password123',
        cpf: '12345678901',
        endereco: 'Rua Exemplo, 123',
      }),
    };

    cognito.adminGetUser.mockResolvedValueOnce({}); // Usuário encontrado

    return handler(event)
      .then((response) => {
        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.body).error).toBe('Usuário já existe.');
      })
      .catch((error) => fail(`Erro inesperado: ${error}`));
  });

  it('should return 500 if there is an error creating the user in Cognito', () => {
    const event = {
      body: JSON.stringify({
        userName: 'testUser',
        email: 'testuser@example.com',
        password: 'password123',
        cpf: '12345678901',
        endereco: 'Rua Exemplo, 123',
      }),
    };

    cognito.adminGetUser.mockRejectedValueOnce(new Error('UserNotFoundException'));
    cognito.signUp.mockRejectedValueOnce(new Error('Erro ao criar usuário'));

    return handler(event)
      .then((response) => {
        expect(response.statusCode).toBe(500);
        expect(JSON.parse(response.body).error).toBe('Erro ao criar usuário');
      })
      .catch((error) => fail(`Erro inesperado: ${error}`));
  });

  it('should return 201 and create a user successfully', () => {
    const event = {
      body: JSON.stringify({
        userName: 'testUser',
        email: 'testuser@example.com',
        password: 'password123',
        cpf: '12345678901',
        endereco: 'Rua Exemplo, 123',
      }),
    };

    cognito.adminGetUser.mockRejectedValueOnce(new Error('UserNotFoundException'));
    cognito.signUp.mockResolvedValueOnce({});
    sns.publish.mockResolvedValueOnce({});
    sns.subscribe.mockResolvedValueOnce({});

    return handler(event)
      .then((response) => {
        expect(response.statusCode).toBe(201);
        expect(JSON.parse(response.body).message).toBe(
          'Usuário cadastrado com sucesso, notificado no SNS e assinatura criada!'
        );
      })
      .catch((error) => fail(`Erro inesperado: ${error}`));
  });

  it('should return 500 if SNS publishing fails', () => {
    const event = {
      body: JSON.stringify({
        userName: 'testUser',
        email: 'testuser@example.com',
        password: 'password123',
        cpf: '12345678901',
        endereco: 'Rua Exemplo, 123',
      }),
    };

    cognito.adminGetUser.mockRejectedValueOnce(new Error('UserNotFoundException'));
    cognito.signUp.mockResolvedValueOnce({});
    sns.publish.mockRejectedValueOnce(new Error('Erro ao publicar no SNS'));

    return handler(event)
      .then((response) => {
        expect(response.statusCode).toBe(500);
        expect(JSON.parse(response.body).error).toBe('Erro ao publicar no SNS');
      })
      .catch((error) => fail(`Erro inesperado: ${error}`));
  });

  it('should return 500 if SNS subscription fails', () => {
    const event = {
      body: JSON.stringify({
        userName: 'testUser',
        email: 'testuser@example.com',
        password: 'password123',
        cpf: '12345678901',
        endereco: 'Rua Exemplo, 123',
      }),
    };

    cognito.adminGetUser.mockRejectedValueOnce(new Error('UserNotFoundException'));
    cognito.signUp.mockResolvedValueOnce({});
    sns.publish.mockResolvedValueOnce({});
    sns.subscribe.mockRejectedValueOnce(new Error('Erro ao criar a assinatura no SNS'));

    return handler(event)
      .then((response) => {
        expect(response.statusCode).toBe(500);
        expect(JSON.parse(response.body).error).toBe('Erro ao criar a assinatura no SNS');
      })
      .catch((error) => fail(`Erro inesperado: ${error}`));
  });
});
