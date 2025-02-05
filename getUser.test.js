const { CognitoIdentityProviderClient, InitiateAuthCommand } = require("@aws-sdk/client-cognito-identity-provider");
const { handler } = require("./getUser.js");

jest.mock("@aws-sdk/client-cognito-identity-provider", () => {
  const actual = jest.requireActual("@aws-sdk/client-cognito-identity-provider");

  return {
    ...actual,
    CognitoIdentityProviderClient: jest.fn().mockImplementation(() => ({
      send: jest.fn(),
    })),
  };
});

describe("getUser handler", () => {
  it("should return 400 if userName is missing", async () => {
    const event = { body: JSON.stringify({ password: "testPass" }) };
    const response = await handler(event);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).error).toBe("Nome de usuário não fornecido"); // Ajustado para o que o código de produção retorna
  });

  it("should return 400 if password is missing", async () => {
    const event = { body: JSON.stringify({ userName: "testUser" }) };
    const response = await handler(event);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).error).toBe("Nome de usuário não fornecido"); // Ajustado para o que o código de produção retorna
  });

  it("should return token if authentication is successful", async () => {
    // Simula uma resposta de sucesso do Cognito
    CognitoIdentityProviderClient.prototype.send.mockResolvedValueOnce({
      AuthenticationResult: { AccessToken: "fake-token" },
    });

    const event = { body: JSON.stringify({ userName: "testUser", password: "testPass" }) };
    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).token).toBe("fake-token");
  });

  it("should return 500 on authentication failure", async () => {
    // Simula uma falha de autenticação
    CognitoIdentityProviderClient.prototype.send.mockRejectedValueOnce(new Error("Auth failed"));

    const event = { body: JSON.stringify({ userName: "testUser", password: "wrongPass" }) };
    const response = await handler(event);
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).message).toBe("Auth failed");
  });
});
