const translations = require('../utils/translations');

/**
 * i18n Middleware
 * - Reads language from session (default: 'en')
 * - Injects `t` (translations) and `lang` into res.locals for every view
 */
function i18nMiddleware(req, res, next) {
    const lang = req.session.lang || 'en';
    res.locals.t = translations[lang] || translations['en'];
    res.locals.lang = lang;
    next();
}

module.exports = i18nMiddleware;
