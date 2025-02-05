import { handler } from "./getUser";
import { CognitoIdentityProviderClient, InitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider";

jest.mock("@aws-sdk/client-cognito-identity-provider", () => {
    return {
        CognitoIdentityProviderClient: jest.fn().mockImplementation(() => ({
            send: jest.fn().mockImplementation((command) => {
                if (command instanceof InitiateAuthCommand) {
                    return Promise.resolve({ AuthenticationResult: { AccessToken: "fake-token" } });
                }
                return Promise.reject(new Error("Unknown command"));
            })
        })),
        InitiateAuthCommand: jest.fn()
    };
});

describe("getUser Lambda Handler", () => {
    it("deve retornar erro se userName não for fornecido", async () => {
        const event = { queryStringParameters: { password: "test123" } };
        const response = await handler(event);
        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.body).error).toBe("Nome de usuário não fornecido");
    });

    it("deve retornar erro se password não for fornecido", async () => {
        const event = { queryStringParameters: { userName: "usuarioTeste" } };
        const response = await handler(event);
        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.body).error).toBe("Senha não fornecida");
    });

    it("deve autenticar o usuário com sucesso", async () => {
        const event = { queryStringParameters: { userName: "usuarioTeste", password: "senhaSegura" } };
        const response = await handler(event);
        expect(response.statusCode).toBe(200);
        expect(JSON.parse(response.body).token).toBe("fake-token");
    });
});
