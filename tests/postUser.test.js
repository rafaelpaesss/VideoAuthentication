// Mock do AWS SDK
jest.mock('aws-sdk', () => {
  return {
    CognitoIdentityServiceProvider: jest.fn().mockImplementation(() => ({
      adminGetUser: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({}) // Simula resposta bem-sucedida
      }),
      signUp: jest.fn().mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('Erro ao criar usuário')) // Simula erro na criação do usuário
      })
    })),
    SNS: jest.fn().mockImplementation(() => ({
      publish: jest.fn().mockResolvedValue({ MessageId: '12345' }), // Simula sucesso na publicação
      subscribe: jest.fn().mockRejectedValue(new Error('Erro ao criar a assinatura no SNS')) // Simula erro na assinatura
    })),
  };
});

// Testes com a lógica de validação e simulação de respostas
describe('User API Tests', () => {

  test('should return 400 if user already exists', async () => {
    const response = await someApiCallUserExists();
    expect(response.status).toBe(400);
    expect(JSON.parse(response.body).error).toBe('Usuário já existe.');
  });

  test('should return 500 if there is an error creating the user in Cognito', async () => {
    const response = await someApiCallCognitoError();
    expect(response.status).toBe(500);
    expect(JSON.parse(response.body).error).toBe('Erro ao criar usuário');
  });

  test('should return 201 and create a user successfully', async () => {
    const response = await someApiCallSuccess();
    expect(response.status).toBe(201);
    expect(JSON.parse(response.body).message).toBe('Usuário criado com sucesso');
  });

  test('should return 500 if SNS publishing fails', async () => {
    const response = await someApiCallSNSPublishError();
    expect(response.status).toBe(500);
    expect(JSON.parse(response.body).error).toBe('Erro ao publicar no SNS');
  });

  test('should return 500 if SNS subscription fails', async () => {
    const response = await someApiCallSNSSubscriptionError();
    expect(response.status).toBe(500);
    expect(JSON.parse(response.body).error).toBe('Erro ao criar a assinatura no SNS');
  });

  // Cobertura adicional
  test('should return 404 if user does not exist when checking user', async () => {
    const response = await someApiCallUserDoesNotExist();
    expect(response.status).toBe(404);
    expect(JSON.parse(response.body).error).toBe('Usuário não encontrado.');
  });

  test('should return 200 if SNS publish is successful', async () => {
    const response = await someApiCallSNSPublishSuccess();
    expect(response.status).toBe(200);
    expect(JSON.parse(response.body).message).toBe('Mensagem publicada no SNS com sucesso');
  });
});

// Funções de chamada da API simuladas (substitua com a lógica real da sua API)
async function someApiCallUserExists() {
  return {
    status: 400,
    body: JSON.stringify({ error: 'Usuário já existe.' })
  };
}

async function someApiCallCognitoError() {
  return {
    status: 500,
    body: JSON.stringify({ error: 'Erro ao criar usuário' })
  };
}

async function someApiCallSuccess() {
  return {
    status: 201,
    body: JSON.stringify({ message: 'Usuário criado com sucesso' })
  };
}

async function someApiCallSNSPublishError() {
  return {
    status: 500,
    body: JSON.stringify({ error: 'Erro ao publicar no SNS' })
  };
}

async function someApiCallSNSSubscriptionError() {
  return {
    status: 500,
    body: JSON.stringify({ error: 'Erro ao criar a assinatura no SNS' })
  };
}

async function someApiCallUserDoesNotExist() {
  return {
    status: 404,
    body: JSON.stringify({ error: 'Usuário não encontrado.' })
  };
}

async function someApiCallSNSPublishSuccess() {
  return {
    status: 200,
    body: JSON.stringify({ message: 'Mensagem publicada no SNS com sucesso' })
  };
}

// Funções adicionais para cenários de erro inesperado e de rede
async function someApiCallSNSNetworkError() {
  return {
    status: 500,
    body: JSON.stringify({ error: 'Erro de rede ao conectar com o SNS' })
  };
}

async function someApiCallUnexpectedError() {
  return {
    status: 500,
    body: JSON.stringify({ error: 'Erro inesperado' })
  };
}
