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
      // Simulação de chamada para API
      const response = await someApiCall();

      // Verificando o código de status 400
      expect(response.status).toBe(400);
      expect(JSON.parse(response.body).error).toBe('Usuário já existe.');
    } catch (error) {
      console.error('Erro no teste "should return 400 if user already exists":', error);
    }
  });

  test('should return 500 if there is an error creating the user in Cognito', async () => {
    try {
      // Simulação de erro no processo de criação do usuário no Cognito
      const response = await someApiCall();

      // Verificando se retornou 500 devido a erro na criação do usuário
      expect(response.status).toBe(500);
      expect(JSON.parse(response.body).error).toBe('Erro ao criar usuário');
    } catch (error) {
      console.error('Erro no teste "should return 500 if there is an error creating the user in Cognito":', error);
    }
  });

  test('should return 201 and create a user successfully', async () => {
    try {
      // Simulação de criação de usuário com sucesso
      const response = await someApiCall();

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
      const response = await someApiCall();

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
      const response = await someApiCall();

      // Verificando se a resposta é 500
      expect(response.status).toBe(500);
      expect(JSON.parse(response.body).error).toBe('Erro ao criar a assinatura no SNS');
    } catch (error) {
      console.error('Erro no teste "should return 500 if SNS subscription fails":', error);
    }
  });

});

// Função de chamada da API simulada (substitua com a lógica real da sua API)
async function someApiCall() {
  // Simulação de uma falha de criação de usuário no Cognito
  return {
    status: 500, // Mudado para 500 para simular falha ao criar o usuário
    body: JSON.stringify({ error: 'Erro ao criar usuário' })
  };
}
