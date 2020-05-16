const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth.json');

module.exports = (req, res, next) => {

    const authHeader = req.headers.authorization;
    console.log(authHeader);

    if(!authHeader){ 
        return res.status(401).send({ error: 'No token provided.'});
    }

    // Valida a estrutura do token enviado 
    const parts = authHeader.split(' ');
    if(!parts.length === 2) {
        return res.status(401).send({ error: 'Invalid token'});
    }
    const [ scheme, token ] = parts;
    if(!/^Bearer$/i.test(scheme)) {
        return res.status(401).send({ error: 'Token malformatted'});
    }
    
    // Verifica se o token é valido 
    jwt.verify(token, authConfig.secret, (err, decoded) => {
        if(err) {
            return res.status(401).send({ error: 'Invalid token'} );
        }

        req.userId = decoded.id;
        return next();
    })

    
}