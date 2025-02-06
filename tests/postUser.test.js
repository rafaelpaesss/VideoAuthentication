const AWS = require('aws-sdk');
const { handler: originalHandler } = require('../src/postUser');

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
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

    cognito.adminGetUser.mockReturnValueOnce(Promise.resolve({}));

    return originalHandler(event).then((response) => {
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).error).toBe('Usuário já existe.');
    });
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

    cognito.adminGetUser.mockReturnValueOnce(Promise.reject({ code: 'UserNotFoundException' }));
    cognito.signUp.mockReturnValueOnce(Promise.reject(new Error('Erro ao criar usuário')));

    return originalHandler(event)
      .then((response) => {
        expect(response.statusCode).toBe(500);
        expect(JSON.parse(response.body).error).toBe('Erro ao criar usuário');
      })
      .catch((error) => {
        console.error('Erro inesperado:', error);
      });
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

    cognito.adminGetUser.mockReturnValueOnce(Promise.reject({ code: 'UserNotFoundException' }));
    cognito.signUp.mockReturnValueOnce(Promise.resolve({}));
    sns.publish.mockReturnValueOnce(Promise.resolve({}));
    sns.subscribe.mockReturnValueOnce(Promise.resolve({}));

    return originalHandler(event).then((response) => {
      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.body).message).toBe(
        'Usuário cadastrado com sucesso, notificado no SNS e assinatura criada!'
      );
    });
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

    cognito.adminGetUser.mockReturnValueOnce(Promise.reject({ code: 'UserNotFoundException' }));
    cognito.signUp.mockReturnValueOnce(Promise.resolve({}));
    sns.publish.mockReturnValueOnce(Promise.reject(new Error('Erro ao publicar no SNS')));

    return originalHandler(event)
      .then((response) => {
        expect(response.statusCode).toBe(500);
        expect(JSON.parse(response.body).error).toBe('Erro ao publicar no SNS');
      })
      .catch((error) => {
        console.error('Erro inesperado:', error);
      });
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

    cognito.adminGetUser.mockReturnValueOnce(Promise.reject({ code: 'UserNotFoundException' }));
    cognito.signUp.mockReturnValueOnce(Promise.resolve({}));
    sns.publish.mockReturnValueOnce(Promise.resolve({}));
    sns.subscribe.mockReturnValueOnce(Promise.reject(new Error('Erro ao criar a assinatura no SNS')));

    return originalHandler(event)
      .then((response) => {
        expect(response.statusCode).toBe(500);
        expect(JSON.parse(response.body).error).toBe('Erro ao criar a assinatura no SNS');
      })
      .catch((error) => {
        console.error('Erro inesperado:', error);
      });
  });
});
