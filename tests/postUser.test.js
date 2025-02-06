const { handler } = require('../src/postUser');  // Certifique-se de que o caminho está correto
const cognito = require('../src/cognito');
const sns = require('../src/sns');

jest.mock('../src/cognito');
jest.mock('../src/sns');

describe('POST /user', () => {
  test('should return 400 if user already exists', async () => {
    const event = {
      body: JSON.stringify({
        userName: 'existingUser',
        email: 'user@example.com',
        password: 'password',
        cpf: '123456789',
        endereco: 'Rua Teste',
      }),
    };
    cognito.adminGetUser.mockResolvedValueOnce({});  // Simulando que o usuário já existe

    const response = await handler(event);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).error).toBe('Usuário já existe.');
  });

  test('should return 500 if there is an error creating the user in Cognito', async () => {
    const event = {
      body: JSON.stringify({
        userName: 'newUser',
        email: 'user@example.com',
        password: 'password',
        cpf: '123456789',
        endereco: 'Rua Teste',
      }),
    };
    cognito.signUp.mockRejectedValueOnce(new Error('Erro ao criar usuário'));

    const response = await handler(event);
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).error).toBe('Erro ao criar usuário');
  });

  test('should return 201 and create a user successfully', async () => {
    const event = {
      body: JSON.stringify({
        userName: 'newUser',
        email: 'user@example.com',
        password: 'password',
        cpf: '123456789',
        endereco: 'Rua Teste',
      }),
    };
    cognito.signUp.mockResolvedValueOnce({});
    sns.publish.mockResolvedValueOnce({});
    sns.subscribe.mockResolvedValueOnce({});

    const response = await handler(event);
    expect(response.statusCode).toBe(201);
    expect(JSON.parse(response.body).message).toBe('Usuário cadastrado com sucesso, notificado no SNS e assinatura criada!');
  });
});
