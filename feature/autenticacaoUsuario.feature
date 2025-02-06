Feature: Autenticação de usuário via Cognito
  Como um usuário
  Eu quero autenticar meu nome de usuário e senha
  Para acessar as funcionalidades protegidas da aplicação

  Scenario: Usuário com nome de usuário e senha corretos
    Given que o usuário possui o nome de usuário "testUser" e a senha "testPass"
    When o usuário faz uma solicitação de autenticação
    Then o sistema deve retornar 200 com um token de acesso e as informações do usuário

  Scenario: Usuário sem nome de usuário fornecido
    Given que o nome de usuário não foi fornecido
    When o usuário faz uma solicitação de autenticação
    Then o sistema deve retornar 400 com a mensagem "Nome de usuário não fornecido"

  Scenario: Usuário sem senha fornecida
    Given que a senha não foi fornecida
    When o usuário faz uma solicitação de autenticação
    Then o sistema deve retornar 400 com a mensagem "Senha não fornecida"

  Scenario: Senha incorreta para o nome de usuário fornecido
    Given que o nome de usuário "testUser" foi fornecido com a senha "wrongPass"
    When o usuário faz uma solicitação de autenticação
    Then o sistema deve retornar 401 com a mensagem "Senha incorreta ou usuário não autorizado"

  Scenario: Usuário não encontrado
    Given que o nome de usuário "unknownUser" não existe no sistema
    When o usuário faz uma solicitação de autenticação
    Then o sistema deve retornar 404 com a mensagem "Usuário não encontrado"

  Scenario: Erro no servidor durante a autenticação
    Given que ocorreu um erro ao tentar autenticar o usuário
    When o usuário faz uma solicitação de autenticação
    Then o sistema deve retornar 500 com a mensagem "Erro interno do servidor"
