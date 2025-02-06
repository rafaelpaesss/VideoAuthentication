const handler = async (event) => {
  const { userName, email, password, cpf, endereco } = JSON.parse(event.body);

  try {
    // Verifica se o usuário já existe
    try {
      await cognito.adminGetUser({ Username: userName }).promise();
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Usuário já existe.' }),
      };
    } catch (error) {
      if (error.code !== 'UserNotFoundException') {
        throw error;  // Aqui, o erro deve ser tratado corretamente
      }
    }

    // Criação do usuário no Cognito
    try {
      await cognito.signUp({
        ClientId: 'client-id',
        Username: userName,
        Password: password,
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'cpf', Value: cpf },
          { Name: 'address', Value: endereco },
        ],
      }).promise();
    } catch (error) {
      console.error('Error creating user:', error);  // Logando o erro
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Erro ao criar usuário' }),
      };
    }

    // Publicação no SNS
    try {
      await sns.publish({
        Message: `Novo usuário criado: ${userName}`,
        TopicArn: 'arn:aws:sns:us-east-1:123456789012:MyTopic',
      }).promise();
    } catch (error) {
      console.error('Error publishing to SNS:', error);  // Logando o erro
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Erro ao publicar no SNS' }),
      };
    }

    // Assinatura no SNS
    try {
      await sns.subscribe({
        Protocol: 'email',
        Endpoint: 'example@example.com',
        TopicArn: 'arn:aws:sns:us-east-1:123456789012:MyTopic',
      }).promise();
    } catch (error) {
      console.error('Error subscribing to SNS:', error);  // Logando o erro
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Erro ao criar a assinatura no SNS' }),
      };
    }

    return {
      statusCode: 201,
      body: JSON.stringify({ message: 'Usuário cadastrado com sucesso, notificado no SNS e assinatura criada!' }),
    };
  } catch (error) {
    console.error('Internal server error:', error);  // Logando o erro
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro interno do servidor' }),
    };
  }
};
