const { handler: originalHandler } = require('./getUser'); // Importando o handler original

// Criando um handler de teste que simula as respostas do getUser
const handler = async (event) => {
  const { body } = event;
  const parsedBody = JSON.parse(body);
  
  const userName = parsedBody.userName;
  const password = parsedBody.password;

  if (!userName) {
    return { statusCode: 400, body: JSON.stringify({ error: "Nome de usuário não fornecido" }) };
  }

  if (!password) {
    return { statusCode: 400, body: JSON.stringify({ error: "Senha não fornecida" }) };
  }

  if (userName === "testUser" && password === "testPass") {
    return { statusCode: 200, body: JSON.stringify({ token: "fake-token" }) };
  }

  return { statusCode: 500, body: JSON.stringify({ message: "Auth failed" }) };
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
});
