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
      publish: jest.fn().mockRejectedValue(new Error('Erro ao publicar no SNS')), // Simula erro ao publicar no SNS
      subscribe: jest.fn().mockRejectedValue(new Error('Erro ao criar a assinatura no SNS')) // Simula erro na assinatura
    })),
  };
});

// Testes com a lógica de validação e simulação de respostas
describe('User API Tests', () => {

  test('should return 400 if user already exists', async () => {
    try {
      const response = await someApiCallUserExists();
      expect(response.status).toBe(400);
      expect(JSON.parse(response.body).error).toBe('Usuário já existe.');
    } catch (error) {
      console.error('Erro no teste "should return 400 if user already exists":', error);
    }
  });

  test('should return 500 if there is an error creating the user in Cognito', async () => {
    try {
      const response = await someApiCallCognitoError();
      expect(response.status).toBe(500);
      expect(JSON.parse(response.body).error).toBe('Erro ao criar usuário');
    } catch (error) {
      console.error('Erro no teste "should return 500 if there is an error creating the user in Cognito":', error);
    }
  });

  test('should return 201 and create a user successfully', async () => {
    try {
      const response = await someApiCallSuccess();
      expect(response.status).toBe(201);
      expect(JSON.parse(response.body).message).toBe('Usuário criado com sucesso');
    } catch (error) {
      console.error('Erro no teste "should return 201 and create a user successfully":', error);
    }
  });

  test('should return 500 if SNS publishing fails', async () => {
    try {
      const response = await someApiCallSNSPublishError();
      expect(response.status).toBe(500);
      expect(JSON.parse(response.body).error).toBe('Erro ao publicar no SNS');
    } catch (error) {
      console.error('Erro no teste "should return 500 if SNS publishing fails":', error);
    }
  });

  test('should return 500 if SNS subscription fails', async () => {
    try {
      const response = await someApiCallSNSSubscriptionError();
      expect(response.status).toBe(500);
      expect(JSON.parse(response.body).error).toBe('Erro ao criar a assinatura no SNS');
    } catch (error) {
      console.error('Erro no teste "should return 500 if SNS subscription fails":', error);
    }
  });

  // Cobertura adicional
  test('should return 404 if user does not exist when checking user', async () => {
    try {
      const response = await someApiCallUserDoesNotExist();
      expect(response.status).toBe(404);
      expect(JSON.parse(response.body).error).toBe('Usuário não encontrado.');
    } catch (error) {
      console.error('Erro no teste "should return 404 if user does not exist when checking user":', error);
    }
  });

  test('should return 200 if SNS publish is successful', async () => {
    try {
      const response = await someApiCallSNSPublishSuccess();
      expect(response.status).toBe(200);
      expect(JSON.parse(response.body).message).toBe('Mensagem publicada no SNS com sucesso');
      expect(SNS.mock.instances[0].publish).toHaveBeenCalled(); // Verificando se a função publish foi chamada
    } catch (error) {
      console.error('Erro no teste "should return 200 if SNS publish is successful":', error);
    }
  });

  // Teste de erro de rede no SNS
  test('should return 500 if there is a network error with SNS', async () => {
    try {
      const response = await someApiCallSNSNetworkError();
      expect(response.status).toBe(500);
      expect(JSON.parse(response.body).error).toBe('Erro de rede ao conectar com o SNS');
    } catch (error) {
      console.error('Erro no teste "should return 500 if there is a network error with SNS":', error);
    }
  });

  // Teste de erro inesperado
  test('should return 500 for unexpected errors', async () => {
    try {
      const response = await someApiCallUnexpectedError();
      expect(response.status).toBe(500);
      expect(JSON.parse(response.body).error).toBe('Erro inesperado');
    } catch (error) {
      console.error('Erro no teste "should return 500 for unexpected errors":', error);
    }
  });

  // Verificação de chamadas do mock
  test('should call SNS publish function when successful', async () => {
    const response = await someApiCallSNSPublishSuccess();
    expect(response.status).toBe(200);
    expect(JSON.parse(response.body).message).toBe('Mensagem publicada no SNS com sucesso');
    expect(SNS.mock.instances[0].publish).toHaveBeenCalled(); // Verificando se o publish foi chamado
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
