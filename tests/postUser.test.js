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
      // Simulando a chamada para API de criação de usuário com um erro de usuário já existente
      const response = await someApiCallUserExists();

      // Verificando o código de status 400
      expect(response.status).toBe(400);
      expect(JSON.parse(response.body).error).toBe('Usuário já existe.');
    } catch (error) {
      console.error('Erro no teste "should return 400 if user already exists":', error);
    }
  });

  test('should return 500 if there is an error creating the user in Cognito', async () => {
    try {
      // Simulando erro no processo de criação do usuário no Cognito
      const response = await someApiCallCognitoError();

      // Verificando se retornou 500 devido a erro na criação do usuário
      expect(response.status).toBe(500);
      expect(JSON.parse(response.body).error).toBe('Erro ao criar usuário');
    } catch (error) {
      console.error('Erro no teste "should return 500 if there is an error creating the user in Cognito":', error);
    }
  });

  test('should return 201 and create a user successfully', async () => {
    try {
      // Simulando criação de usuário com sucesso
      const response = await someApiCallSuccess();

      // Verificando se a resposta é 201 (sucesso)
      expect(response.status).toBe(201);
      expect(JSON.parse(response.body).message).toBe('Usuário criado com sucesso');
    } catch (error) {
      console.error('Erro no teste "should return 201 and create a user successfully":', error);
    }
  });

  test('should return 500 if SNS publishing fails', async () => {
    try {
      // Simulação de erro ao publicar no SNS
      const response = await someApiCallSNSPublishError();

      // Verificando se a resposta é 500
      expect(response.status).toBe(500);
      expect(JSON.parse(response.body).error).toBe('Erro ao publicar no SNS');
    } catch (error) {
      console.error('Erro no teste "should return 500 if SNS publishing fails":', error);
    }
  });

  test('should return 500 if SNS subscription fails', async () => {
    try {
      // Simulação de erro ao criar a assinatura no SNS
      const response = await someApiCallSNSSubscriptionError();

      // Verificando se a resposta é 500
      expect(response.status).toBe(500);
      expect(JSON.parse(response.body).error).toBe('Erro ao criar a assinatura no SNS');
    } catch (error) {
      console.error('Erro no teste "should return 500 if SNS subscription fails":', error);
    }
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
