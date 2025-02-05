const { CognitoIdentityProviderClient, InitiateAuthCommand } = require("@aws-sdk/client-cognito-identity-provider");
const { handler } = require("./getUser.js");

jest.mock("@aws-sdk/client-cognito-identity-provider", () => {
    const actual = jest.requireActual("@aws-sdk/client-cognito-identity-provider");
    
    return {
        ...actual,
        CognitoIdentityProviderClient: jest.fn().mockImplementation(() => ({
            send: jest.fn().mockImplementation((command) => {
                if (command instanceof actual.InitiateAuthCommand) {
                    return Promise.resolve({ AuthenticationResult: { AccessToken: "fake-token" } });
                }
                return Promise.reject(new Error("Unknown command"));
            }),
        })),
    };
});

describe("getUser handler", () => {
    it("should return 400 if userName is missing", async () => {
        const event = { body: JSON.stringify({ password: "testPass" }) };
        const response = await handler(event);
        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.body).message).toBe("Missing userName or password");
    });

    it("should return 400 if password is missing", async () => {
        const event = { body: JSON.stringify({ userName: "testUser" }) };
        const response = await handler(event);
        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.body).message).toBe("Missing userName or password");
    });

    it("should return token if authentication is successful", async () => {
        const event = { body: JSON.stringify({ userName: "testUser", password: "testPass" }) };
        const response = await handler(event);
        expect(response.statusCode).toBe(200);
        expect(JSON.parse(response.body).token).toBe("fake-token");
    });

    it("should return 500 on authentication failure", async () => {
        jest.spyOn(CognitoIdentityProviderClient.prototype, "send").mockRejectedValueOnce(new Error("Auth failed"));

        const event = { body: JSON.stringify({ userName: "testUser", password: "wrongPass" }) };
        const response = await handler(event);
        expect(response.statusCode).toBe(500);
        expect(JSON.parse(response.body).message).toBe("Auth failed");
    });
});
