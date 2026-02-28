/**
 * Configuração da aplicação (ex.: para futura API HTTP).
 * Porta via variável de ambiente PORT ou padrão 3000.
 */
export const config = {
  port: Number(process.env.PORT) || 3000,
};
