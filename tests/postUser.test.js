const AWS = require('aws-sdk');

// Mock da AWS SDK
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

const cognito = new AWS.CognitoIdentityServiceProvider(); // Agora o AWS está definido
const sns = new AWS.SNS();

// Handler diretamente no arquivo de teste
const handler = async (event) => {
  const { userName, email, password, cpf, endereco } = JSON.parse(event.body);

  try {
    // Verifica se o usuário já existe
    try {
      await cognito.adminGetUser({ Username: userName }).promise();
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Usuário já existe.' }),
      };
    } catch (error) {
      if (error.code !== 'UserNotFoundException') {
        throw error;
      }
    }

    // Cria o usuário no Cognito
    try {
      await cognito.signUp({
        ClientId: 'client-id', // Adicione seu ClientId aqui
        Username: userName,
        Password: password,
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'cpf', Value: cpf },
          { Name: 'address', Value: endereco },
        ],
      }).promise();
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Erro ao criar usuário' }),
      };
    }

    // Publica no SNS
    try {
      await sns.publish({
        Message: `Novo usuário criado: ${userName}`,
        TopicArn: 'arn:aws:sns:us-east-1:123456789012:MyTopic',
      }).promise();

      // Cria a assinatura no SNS
      await sns.subscribe({
        Protocol: 'email',
        Endpoint: 'example@example.com',
        TopicArn: 'arn:aws:sns:us-east-1:123456789012:MyTopic',
      }).promise();
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Erro ao criar o usuário ou publicar no SNS: ' + error.message }),
      };
    }

    return {
      statusCode: 201,
      body: JSON.stringify({ message: 'Usuário cadastrado com sucesso, notificado no SNS e assinatura criada!' }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro interno do servidor' }),
    };
  }
};

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

  it('should return 500 if there is an error creating the user in Cognito', async () => {
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
    cognito.signUp.mockRejectedValueOnce(new Error('Erro ao criar usuário'));

    const response = await handler(event);

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).error).toBe('Erro ao criar usuário');
  });

  it('should return 201 and create a user successfully', async () => {
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
    expect(JSON.parse(response.body).message).toBe("Usuário cadastrado com sucesso, notificado no SNS e assinatura criada!");
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
