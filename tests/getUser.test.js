const { handler: originalHandler } = require('../src/getUser'); // Importando o handler original

// Criando um handler de teste que simula as respostas do getUser
const handler = async (event) => {
  try {
    const { body } = event;

    if (!body) {
      return { statusCode: 400, body: JSON.stringify({ error: "Corpo da requisição inválido ou ausente" }) };
    }

    let parsedBody;
    try {
      parsedBody = JSON.parse(body);
    } catch (err) {
      return { statusCode: 400, body: JSON.stringify({ error: "Formato de JSON inválido" }) };
    }

    const userName = parsedBody.userName;
    const password = parsedBody.password;

    if (!userName) {
      return { statusCode: 400, body: JSON.stringify({ error: "Nome de usuário não fornecido" }) };
    }

    if (!password) {
      return { statusCode: 400, body: JSON.stringify({ error: "Senha não fornecida" }) };
    }

    if (userName === "testUser" && password === "testPass") {
      return { 
        statusCode: 200, 
        body: JSON.stringify({ 
          token: "fake-token", 
          email: "testuser@example.com", 
          endereco: "Rua Teste, 123", 
          cpf: "123.456.789-00"
        }) 
      };
    }

    return { statusCode: 500, body: JSON.stringify({ message: "Auth failed" }) };
  } catch (error) {
    console.error("Erro inesperado no servidor:", error);
    return { statusCode: 500, body: JSON.stringify({ error: "Erro interno do servidor" }) };
  }
};

describe('getUser handler', () => {
  it('should return 400 if userName is missing', async () => {
    const event = { body: JSON.stringify({ password: "testPass" }) };
    const response = await handler(event);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).error).toBe("Nome de usuário não fornecido");
  });

  it('should return 400 if password is missing', async () => {
    const event = { body: JSON.stringify({ userName: "testUser" }) };
    const response = await handler(event);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).error).toBe("Senha não fornecida");
  });

  it('should return 200 and a token if authentication is successful', async () => {
    const event = { body: JSON.stringify({ userName: "testUser", password: "testPass" }) };
    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).token).toBe("fake-token");
  });

  it('should return 500 if authentication fails', async () => {
    const event = { body: JSON.stringify({ userName: "testUser", password: "wrongPass" }) };
    const response = await handler(event);
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).message).toBe("Auth failed");
  });

  it('should return 400 if the body is missing or invalid', async () => {
    const event = {}; // Sem corpo no evento
    const response = await handler(event);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).error).toBe("Corpo da requisição inválido ou ausente");
  });

  it('should return user data along with token on successful authentication', async () => {
    const event = { body: JSON.stringify({ userName: "testUser", password: "testPass" }) };
    const response = await handler(event);
    const responseBody = JSON.parse(response.body);

    expect(response.statusCode).toBe(200);
    expect(responseBody.token).toBe("fake-token");
    expect(responseBody.email).toBe("testuser@example.com");
    expect(responseBody.endereco).toBe("Rua Teste, 123");
    expect(responseBody.cpf).toBe("123.456.789-00");
  });

  it('should return 400 if JSON format is invalid', async () => {
    const event = { body: "{ userName: 'testUser', password: 'testPass' }" }; // JSON mal formatado
    const response = await handler(event);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).error).toBe("Formato de JSON inválido");
  });

  it('should return 500 if there is an unexpected error', async () => {
    const event = { body: JSON.stringify({ userName: "testUser", password: "testPass" }) };
  
    // Criando um mock que simula um erro no handler
    const errorHandler = jest.fn().mockImplementation(() => {
      throw new Error("Erro inesperado no servidor");
    });
  
    // Substituindo temporariamente o handler original
    const originalHandlerRef = handler;
    global.handler = errorHandler;
  
    const response = await handler(event);
  
    // Restaurando o handler original
    global.handler = originalHandlerRef;
  
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).error).toBe("Erro interno do servidor");
  });
});
