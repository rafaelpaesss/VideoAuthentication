const AWS = require("aws-sdk");
const getUserHandler = require("./getUser");

jest.mock("aws-sdk", () => {
  const mockCognito = {
    initiateAuth: jest.fn(),
    respondToAuthChallenge: jest.fn(),
    getUser: jest.fn(),
  };

  return {
    CognitoIdentityServiceProvider: jest.fn(() => mockCognito),
  };
});

const mockCognito = new AWS.CognitoIdentityServiceProvider();

describe("getUser Lambda Handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Deve retornar erro 400 se userName não for fornecido", async () => {
    const event = { queryStringParameters: { password: "test123" } };
    const response = await getUserHandler.handler(event);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).error).toBe("Nome de usuário não fornecido");
  });

  test("Deve retornar erro 400 se password não for fornecido", async () => {
    const event = { queryStringParameters: { userName: "usuarioTeste" } };
    const response = await getUserHandler.handler(event);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).error).toBe("Senha não fornecida");
  });

  test("Deve autenticar usuário com sucesso", async () => {
    const event = {
      queryStringParameters: { userName: "usuarioTeste", password: "senhaSegura" },
    };

    mockCognito.initiateAuth.mockResolvedValue({
      AuthenticationResult: { AccessToken: "fake-access-token" },
    });

    mockCognito.getUser.mockResolvedValue({
      UserAttributes: [
        { Name: "email", Value: "usuario@email.com" },
        { Name: "custom:endereco", Value: "Rua 123" },
        { Name: "custom:cpf", Value: "12345678900" },
      ],
    });

    const response = await getUserHandler.handler(event);

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toMatchObject({
      message: "Autenticação bem-sucedida",
      email: "usuario@email.com",
      endereco: "Rua 123",
      cpf: "12345678900",
    });

    expect(mockCognito.initiateAuth).toHaveBeenCalledTimes(1);
    expect(mockCognito.getUser).toHaveBeenCalledTimes(1);
  });

  test("Deve retornar erro 401 para senha incorreta", async () => {
    const event = {
      queryStringParameters: { userName: "usuarioTeste", password: "senhaErrada" },
    };

    mockCognito.initiateAuth.mockRejectedValue({ code: "NotAuthorizedException" });

    const response = await getUserHandler.handler(event);
    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body).error).toBe("Senha incorreta ou usuário não autorizado");
  });

  test("Deve retornar erro 404 se o usuário não for encontrado", async () => {
    const event = {
      queryStringParameters: { userName: "usuarioInexistente", password: "senhaSegura" },
    };

    mockCognito.initiateAuth.mockRejectedValue({ code: "UserNotFoundException" });

    const response = await getUserHandler.handler(event);
    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.body).error).toBe("Usuário não encontrado");
  });

  test("Deve retornar erro 500 para falha desconhecida", async () => {
    const event = {
      queryStringParameters: { userName: "usuarioTeste", password: "senhaSegura" },
    };

    mockCognito.initiateAuth.mockRejectedValue(new Error("Erro inesperado"));

    const response = await getUserHandler.handler(event);
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).error).toBe("Erro interno do servidor");
  });
});
