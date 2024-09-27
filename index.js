exports.handler = async (event) => {
    // Extrair o CPF dos parâmetros de consulta
    const cpf = event.queryStringParameters.cpf;

    // Validação básica do CPF
    if (!cpf || cpf.length !== 11) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "CPF inválido" })
        };
    }

    // Integração com o sistema de autenticação
    const isValidUser = checkCpfInAuthSystem(cpf);

    if (isValidUser) {
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Autenticação bem-sucedida" })
        };
    } else {
        return {
            statusCode: 401,
            body: JSON.stringify({ error: "CPF não encontrado ou não autorizado" })
        };
    }
};

// Função que simula a verificação do CPF no sistema de autenticação
function checkCpfInAuthSystem(cpf) {
    const authorizedCpfs = ["12345678901", "09876543210"]; // Exemplo de CPFs autorizados
    return authorizedCpfs.includes(cpf);
}
