module.exports = {
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',  // ou o caminho correto dos seus arquivos
    '!src/**/*.test.{js,jsx}',  // exclui os arquivos de teste da coleta
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
};
