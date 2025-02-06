module.exports = {
  collectCoverage: true, // Habilita a coleta de cobertura de código
  coverageDirectory: 'coverage', // Diretório onde o relatório de cobertura será gerado
  coverageReporters: ['lcov', 'text-summary'], // Formato do relatório de cobertura
  testEnvironment: 'node', // Se você está testando código Node.js
  testMatch: ['**/?(*.)+(spec|test).js'], // Padrão para os arquivos de teste
  collectCoverageFrom: ['src/**/*.js', 'tests/**/*.js'], // Arquivos que serão analisados para cobertura
  coveragePathIgnorePatterns: ['node_modules'], // Ignorar diretórios que não devem ser analisados
};
