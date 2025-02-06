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

const cognito = new AWS.CognitoIdentityServiceProvider();
const sns = new AWS.SNS();

describe('postUser handler', () => {
  it('should return 400 if user already exists', async () => {
    const event = {
      body: JSON.stringify({
        userName: 'testUser',
        email: 'testuser@example.com',
        password: 'password123',
        cpf: '12345678901',
        endereco: 'Rua Exemplo, 123',
      }),
    };

    // Simula o erro de usuário já existente
    cognito.adminGetUser.mockResolvedValueOnce({});
    const response = await handler(event);
    
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).error).toBe("Usuário já existe.");
  });

  it('should return 201 if user is successfully created and SNS notifications sent', async () => {
    const event = {
      body: JSON.stringify({
        userName: 'newUser',
        email: 'newuser@example.com',
        password: 'newpassword123',
        cpf: '98765432100',
        endereco: 'Rua Nova, 456',
      }),
    };

    // Simula a criação do usuário com sucesso
    cognito.adminGetUser.mockRejectedValueOnce({ code: 'UserNotFoundException' });
    cognito.signUp.mockResolvedValueOnce({});
    sns.publish.mockResolvedValueOnce({});
    sns.subscribe.mockResolvedValueOnce({});

    const response = await handler(event);

    expect(response.statusCode).toBe(201);
    expect(JSON.parse(response.body).message).toBe(
      "Usuário cadastrado com sucesso, notificado no SNS e assinatura criada!"
    );
  });

  it('should return 500 if an error occurs during user creation', async () => {
    const event = {
      body: JSON.stringify({
        userName: 'errorUser',
        email: 'erroruser@example.com',
        password: 'errorpassword123',
        cpf: '11122233344',
        endereco: 'Rua Erro, 789',
      }),
    };

    // Simula um erro ao criar o usuário
    cognito.adminGetUser.mockRejectedValueOnce({ code: 'UserNotFoundException' });
    cognito.signUp.mockRejectedValueOnce(new Error('Cognito error'));

    const response = await handler(event);

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).error).toBe('Erro ao criar o usuário ou publicar no SNS: Cognito error');
  });

  it('should return 500 if SNS publishing fails', async () => {
    const event = {
      body: JSON.stringify({
        userName: 'snsErrorUser',
        email: 'snserroruser@example.com',
        password: 'snserrorpassword123',
        cpf: '55555555555',
        endereco: 'Rua SNS, 321',
      }),
    };

    // Simula erro ao publicar no SNS
    cognito.adminGetUser.mockRejectedValueOnce({ code: 'UserNotFoundException' });
    cognito.signUp.mockResolvedValueOnce({});
    sns.publish.mockRejectedValueOnce(new Error('Erro ao publicar no SNS'));

    const response = await handler(event);

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).error).toBe('Erro ao criar o usuário ou publicar no SNS: Erro ao publicar no SNS');
  });

  it('should return 500 if SNS subscription fails', async () => {
    const event = {
      body: JSON.stringify({
        userName: 'snsErrorUser',
        email: 'snserroruser@example.com',
        password: 'snserrorpassword123',
        cpf: '55555555555',
        endereco: 'Rua SNS, 321',
      }),
    };

    // Simula erro ao criar a assinatura no SNS
    cognito.adminGetUser.mockRejectedValueOnce({ code: 'UserNotFoundException' });
    cognito.signUp.mockResolvedValueOnce({});
    sns.subscribe.mockRejectedValueOnce(new Error('Erro ao criar a assinatura no SNS'));

    const response = await handler(event);

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).error).toBe('Erro ao criar o usuário ou publicar no SNS: Erro ao criar a assinatura no SNS');
  });
});
