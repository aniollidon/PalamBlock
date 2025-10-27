/**
 * Gestor de Tokens d'Autenticació
 *
 * Sistema escalable per gestionar tokens d'autenticació amb:
 * - Expiració automàtica de tokens
 * - Neteja periòdica de tokens expirats
 * - Límit de tokens simultanis per usuari
 * - Registre d'activitat per seguretat
 */

const logger = require("../logger").logger;

// Configuració per defecte (pot ser sobreescrita via .env)
const DEFAULT_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hores
const DEFAULT_CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hora
const DEFAULT_MAX_TOKENS_PER_USER = 5; // Màxim de sessions simultànies

class AuthTokenManager {
  /**
   * Crea una nova instància del gestor de tokens
   * @param {Object} options - Opcions de configuració
   * @param {number} options.tokenExpiryMs - Temps d'expiració dels tokens en mil·lisegons
   * @param {number} options.cleanupIntervalMs - Interval de neteja de tokens expirats
   * @param {number} options.maxTokensPerUser - Nombre màxim de tokens actius per usuari
   */
  constructor(options = {}) {
    this.tokenExpiryMs =
      options.tokenExpiryMs ||
      parseInt(process.env.AUTH_TOKEN_EXPIRY_MS || DEFAULT_TOKEN_EXPIRY_MS);

    this.cleanupIntervalMs =
      options.cleanupIntervalMs ||
      parseInt(
        process.env.AUTH_CLEANUP_INTERVAL_MS || DEFAULT_CLEANUP_INTERVAL_MS
      );

    this.maxTokensPerUser =
      options.maxTokensPerUser ||
      parseInt(process.env.MAX_TOKENS_PER_USER || DEFAULT_MAX_TOKENS_PER_USER);

    // Map per emmagatzemar tokens: user -> Array de {token, createdAt, lastUsedAt}
    this.tokens = new Map();

    // Interval de neteja automàtica
    this._cleanupInterval = null;

    // Inicia la neteja automàtica
    this._startCleanup();

    logger.info(
      `AuthTokenManager inicialitzat amb expiració de ${this.tokenExpiryMs}ms`
    );
  }

  /**
   * Crea un nou token per a un usuari
   * Si l'usuari ja té un token vàlid, el retorna
   * @param {string} user - Identificador de l'usuari
   * @returns {string} Token d'autenticació
   */
  createToken(user) {
    if (!user) {
      throw new Error("L'usuari és obligatori per crear un token");
    }

    // Comprova si l'usuari ja té un token vàlid
    const existingToken = this.getValidToken(user);
    if (existingToken) {
      logger.debug(`Token existent reutilitzat per usuari: ${user}`);
      return existingToken;
    }

    // Genera un nou token aleatori i segur
    const token = this._generateSecureToken();
    const now = Date.now();

    // Obté els tokens existents de l'usuari
    let userTokens = this.tokens.get(user) || [];

    // Si l'usuari té massa tokens, elimina els més antics
    if (userTokens.length >= this.maxTokensPerUser) {
      logger.warn(`Usuari ${user} té massa tokens. Eliminant els més antics.`);
      // Ordena per data de creació i elimina els més antics
      userTokens.sort((a, b) => a.createdAt - b.createdAt);
      userTokens = userTokens.slice(-this.maxTokensPerUser + 1);
    }

    // Afegeix el nou token
    userTokens.push({
      token,
      createdAt: now,
      lastUsedAt: now,
    });

    this.tokens.set(user, userTokens);

    logger.info(`Nou token creat per usuari: ${user}`);
    return token;
  }

  /**
   * Valida un token per a un usuari
   * Actualitza lastUsedAt si el token és vàlid
   * @param {string} user - Identificador de l'usuari
   * @param {string} token - Token a validar
   * @returns {boolean} True si el token és vàlid
   */
  validateToken(user, token) {
    if (!user || !token) {
      return false;
    }

    const userTokens = this.tokens.get(user);
    if (!userTokens) {
      return false;
    }

    const now = Date.now();
    const tokenIndex = userTokens.findIndex((t) => {
      const isMatch = t.token === token;
      const isNotExpired = now - t.createdAt < this.tokenExpiryMs;
      return isMatch && isNotExpired;
    });

    if (tokenIndex !== -1) {
      // Actualitza lastUsedAt
      userTokens[tokenIndex].lastUsedAt = now;
      this.tokens.set(user, userTokens);
      return true;
    }

    return false;
  }

  /**
   * Obté un token vàlid existent per a un usuari
   * @param {string} user - Identificador de l'usuari
   * @returns {string|null} Token vàlid o null si no n'hi ha cap
   * @private
   */
  getValidToken(user) {
    const userTokens = this.tokens.get(user);
    if (!userTokens) {
      return null;
    }

    const now = Date.now();
    const validToken = userTokens.find(
      (t) => now - t.createdAt < this.tokenExpiryMs
    );

    if (validToken) {
      // Actualitza lastUsedAt
      validToken.lastUsedAt = now;
      return validToken.token;
    }

    return null;
  }

  /**
   * Invalida tots els tokens d'un usuari
   * @param {string} user - Identificador de l'usuari
   */
  invalidateUserTokens(user) {
    if (!user) {
      return;
    }

    const deleted = this.tokens.delete(user);
    if (deleted) {
      logger.info(`Tokens invalidats per usuari: ${user}`);
    }
  }

  /**
   * Invalida un token específic d'un usuari
   * @param {string} user - Identificador de l'usuari
   * @param {string} token - Token a invalidar
   */
  invalidateToken(user, token) {
    if (!user || !token) {
      return;
    }

    const userTokens = this.tokens.get(user);
    if (!userTokens) {
      return;
    }

    const filteredTokens = userTokens.filter((t) => t.token !== token);

    if (filteredTokens.length === 0) {
      this.tokens.delete(user);
    } else {
      this.tokens.set(user, filteredTokens);
    }

    logger.info(`Token específic invalidat per usuari: ${user}`);
  }

  /**
   * Neteja tots els tokens expirats de tots els usuaris
   * @returns {number} Nombre de tokens eliminats
   */
  cleanupExpiredTokens() {
    const now = Date.now();
    let totalRemoved = 0;

    for (const [user, userTokens] of this.tokens.entries()) {
      const validTokens = userTokens.filter(
        (t) => now - t.createdAt < this.tokenExpiryMs
      );

      const removedCount = userTokens.length - validTokens.length;

      if (removedCount > 0) {
        totalRemoved += removedCount;

        if (validTokens.length === 0) {
          this.tokens.delete(user);
          logger.debug(
            `Tots els tokens expirats eliminats per usuari: ${user}`
          );
        } else {
          this.tokens.set(user, validTokens);
          logger.debug(
            `${removedCount} token(s) expirat(s) eliminat(s) per usuari: ${user}`
          );
        }
      }
    }

    if (totalRemoved > 0) {
      logger.info(
        `[CLEANUP] ${totalRemoved} token(s) expirat(s) eliminat(s) en total`
      );
    }

    return totalRemoved;
  }

  /**
   * Obté estadístiques sobre els tokens actius
   * @returns {Object} Estadístiques del sistema de tokens
   */
  getStats() {
    const now = Date.now();
    let totalTokens = 0;
    let expiredTokens = 0;
    let activeUsers = 0;

    for (const [user, userTokens] of this.tokens.entries()) {
      activeUsers++;
      totalTokens += userTokens.length;

      for (const tokenData of userTokens) {
        if (now - tokenData.createdAt >= this.tokenExpiryMs) {
          expiredTokens++;
        }
      }
    }

    return {
      activeUsers,
      totalTokens,
      validTokens: totalTokens - expiredTokens,
      expiredTokens,
      tokenExpiryMs: this.tokenExpiryMs,
      maxTokensPerUser: this.maxTokensPerUser,
    };
  }

  /**
   * Inicia la neteja automàtica de tokens expirats
   * @private
   */
  _startCleanup() {
    if (this._cleanupInterval) {
      return; // Ja està iniciat
    }

    this._cleanupInterval = setInterval(() => {
      this.cleanupExpiredTokens();
    }, this.cleanupIntervalMs);

    logger.info(
      `Neteja automàtica de tokens iniciada cada ${this.cleanupIntervalMs}ms`
    );
  }

  /**
   * Atura la neteja automàtica i allibera recursos
   * Crida aquest mètode quan el servei s'atura
   */
  destroy() {
    if (this._cleanupInterval) {
      clearInterval(this._cleanupInterval);
      this._cleanupInterval = null;
      logger.info("AuthTokenManager destruït correctament");
    }

    this.tokens.clear();
  }

  /**
   * Genera un token aleatori i segur
   * @returns {string} Token generat
   * @private
   */
  _generateSecureToken() {
    // Genera un token de 32 caràcters aleatoris
    const randomPart1 = Math.random().toString(36).substring(2, 18);
    const randomPart2 = Math.random().toString(36).substring(2, 18);
    const timestamp = Date.now().toString(36);

    return `${randomPart1}${randomPart2}${timestamp}`;
  }
}

// Singleton - una única instància compartida
let instance = null;

/**
 * Obté la instància singleton del gestor de tokens
 * @returns {AuthTokenManager} Instància del gestor
 */
function getInstance() {
  if (!instance) {
    instance = new AuthTokenManager();
  }
  return instance;
}

/**
 * Reinicia el gestor de tokens amb noves opcions
 * @param {Object} options - Opcions de configuració
 * @returns {AuthTokenManager} Nova instància del gestor
 */
function resetInstance(options) {
  if (instance) {
    instance.destroy();
  }
  instance = new AuthTokenManager(options);
  return instance;
}

module.exports = {
  AuthTokenManager,
  getInstance,
  resetInstance,
};
