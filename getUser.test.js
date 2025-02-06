const { handler } = require("./getUser");
const { CognitoIdentityProviderClient, AdminInitiateAuthCommand } = require("@aws-sdk/client-cognito-identity-provider");

jest.mock('@aws-sdk/client-cognito-identity-provider', () => {
  return {
    CognitoIdentityProviderClient: jest.fn(),
  };
});

describe("getUser handler", () => {

  it("should return 400 if userName is missing", async () => {
    const event = { body: JSON.stringify({ password: "testPass" }) };
    const response = await handler(event);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).error).toBe("Nome de usuário não fornecido");
  });

  it("should return 400 if password is missing", async () => {
    const event = { body: JSON.stringify({ userName: "testUser" }) };
    const response = await handler(event);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).error).toBe("Senha não fornecida");
  });

  it("should return token if authentication is successful", async () => {
    CognitoIdentityProviderClient.mockImplementationOnce(() => ({
      send: jest.fn().mockResolvedValueOnce({
        AuthenticationResult: { AccessToken: "fake-token" },
      }),
    }));

    const event = { body: JSON.stringify({ userName: "testUser", password: "testPass" }) };
    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).token).toBe("fake-token");
  });

  it("should return 500 on authentication failure", async () => {
    CognitoIdentityProviderClient.mockImplementationOnce(() => ({
      send: jest.fn().mockRejectedValueOnce(new Error("Auth failed")),
    }));

    const event = { body: JSON.stringify({ userName: "testUser", password: "wrongPass" }) };
    const response = await handler(event);
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).message).toBe("Auth failed");
  });
});
